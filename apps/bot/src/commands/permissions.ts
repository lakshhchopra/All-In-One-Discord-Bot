import { GuildMember, PermissionFlagsBits } from "discord.js";
import { prisma } from "../services/db.js";

export type PermissionLevel = "EVERYONE" | "MODERATOR" | "ADMIN" | "EXTRA_OWNER" | "OWNER";

export async function getPermissionLevel(member: GuildMember): Promise<PermissionLevel> {
  // 1. Bot Owner check (checks application owner/team and env OWNER_IDS)
  const ownerIds = process.env.OWNER_IDS?.split(",") || [];
  if (ownerIds.includes(member.id)) {
    return "OWNER";
  }

  const application = member.client.application;
  if (application) {
    const owner = application.owner;
    if (owner) {
      if (owner.id === member.id) return "OWNER";
      if ((owner as any).members && (owner as any).members.has(member.id)) return "OWNER";
    }
  }

  // 2. Server Guild Owner check
  if (member.guild.ownerId === member.id) {
    return "OWNER";
  }

  // 3. Extra Owners check (from database)
  const extraOwner = await prisma.extraOwner.findUnique({
    where: {
      guildId_userId: {
        guildId: member.guild.id,
        userId: member.id
      }
    }
  });
  if (extraOwner) {
    return "EXTRA_OWNER";
  }

  // 4. Admin level check: Administrator, Manage Guild (Server), Manage Roles, Manage Channels
  if (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.ManageRoles) ||
    member.permissions.has(PermissionFlagsBits.ManageChannels)
  ) {
    return "ADMIN";
  }

  // 5. Moderator check: Manage Messages, Kick Members, Ban Members, Moderate Members, Manage Webhooks
  if (
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers) ||
    member.permissions.has(PermissionFlagsBits.ManageWebhooks)
  ) {
    return "MODERATOR";
  }

  return "EVERYONE";
}

export async function hasPermission(
  member: GuildMember,
  requiredLevel: PermissionLevel
): Promise<boolean> {
  const levels: Record<PermissionLevel, number> = {
    EVERYONE: 0,
    MODERATOR: 1,
    ADMIN: 2,
    EXTRA_OWNER: 3,
    OWNER: 4
  };

  const userLevel = await getPermissionLevel(member);
  return levels[userLevel] >= levels[requiredLevel];
}
