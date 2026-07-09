import { Guild, GuildMember } from "discord.js";
import { prisma } from "../services/db.js";

/**
 * Checks if a user is completely whitelisted (Owner, Extra Owner, or Whitelisted User/Role).
 */
export async function isWhitelisted(guild: Guild, userId: string, actionType?: string): Promise<boolean> {
  // 1. Server Owner is always whitelisted
  if (guild.ownerId === userId) return true;

  // 2. Extra Owners are whitelisted
  const extraOwner = await prisma.extraOwner.findUnique({
    where: { guildId_userId: { guildId: guild.id, userId } }
  });
  if (extraOwner) return true;

  // 3. User Whitelist
  const userWL = await prisma.whitelist.findUnique({
    where: { guildId_targetId: { guildId: guild.id, targetId: userId } }
  });
  if (userWL && userWL.type === "user") {
    if (!actionType || userWL.modules.includes("*") || userWL.modules.includes(actionType)) {
      return true;
    }
  }

  // 4. Role Whitelist
  try {
    const member = await guild.members.fetch(userId);
    const roleIds = member.roles.cache.map(r => r.id);
    const roleWLs = await prisma.whitelist.findMany({
      where: {
        guildId: guild.id,
        targetId: { in: roleIds },
        type: "role"
      }
    });
    for (const wl of roleWLs) {
      if (!actionType || wl.modules.includes("*") || wl.modules.includes(actionType)) {
        return true;
      }
    }
  } catch {
    // Ignore fetch error (e.g. if member left)
  }

  return false;
}

/**
 * Checks if a user is trusted (Owner, Extra Owner, Whitelisted, or Trusted User/Role).
 */
export async function isTrusted(guild: Guild, userId: string): Promise<boolean> {
  if (await isWhitelisted(guild, userId)) return true;

  // Check explicit type "trusted" user
  const trustedUser = await prisma.whitelist.findFirst({
    where: {
      guildId: guild.id,
      targetId: userId,
      type: "trusted"
    }
  });
  if (trustedUser) return true;

  // Check any trusted roles
  try {
    const member = await guild.members.fetch(userId);
    const roleIds = member.roles.cache.map(r => r.id);
    const trustedRole = await prisma.whitelist.findFirst({
      where: {
        guildId: guild.id,
        targetId: { in: roleIds },
        type: "trusted_role"
      }
    });
    if (trustedRole) return true;
  } catch {
    // Ignore fetch error
  }

  return false;
}

/**
 * Checks if a specific target (command, user, channel, role) is ignored in the guild.
 */
export async function isIgnored(
  guild: Guild,
  targetId: string,
  type: "user" | "role" | "channel" | "command"
): Promise<boolean> {
  const ignoreType = `ignore_${type}`;
  
  // Check if target is explicitly ignored
  const isTargetIgnored = await prisma.whitelist.findFirst({
    where: {
      guildId: guild.id,
      targetId,
      type: ignoreType
    }
  });
  if (isTargetIgnored) return true;

  return false;
}
