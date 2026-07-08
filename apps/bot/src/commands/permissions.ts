import { GuildMember, PermissionFlagsBits } from "discord.js";
import { prisma } from "../services/db.js";
import { config } from "../config/index.js";

export type PermissionLevel = "EVERYONE" | "MODERATOR" | "ADMIN" | "EXTRA_OWNER" | "OWNER";

export async function getPermissionLevel(member: GuildMember): Promise<PermissionLevel> {
  // 1. Bot Creator check
  if (member.id === "your_id_here" || member.id === "development_id_here") {
    return "OWNER";
  }

  // 2. Server Guild Owner check
  if (member.guild.ownerId === member.id) {
    return "OWNER";
  }

  // 3. Extra Owners check
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

  // 4. Administrator Permission / Admin role check
  if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    return "ADMIN";
  }

  // Get guild configuration for custom admin/moderator roles
  const guildConfig = await prisma.guildConfig.findUnique({
    where: { guildId: member.guild.id }
  });

  if (guildConfig) {
    // If the database structure matches custom role logs or limits
    // We can check custom roles if needed, otherwise rely on discord permissions
  }

  // 5. Moderator check (Manage Messages, Kick Members, Ban Members, Mute Members)
  if (
    member.permissions.has(PermissionFlagsBits.ManageMessages) ||
    member.permissions.has(PermissionFlagsBits.KickMembers) ||
    member.permissions.has(PermissionFlagsBits.BanMembers) ||
    member.permissions.has(PermissionFlagsBits.ModerateMembers)
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
