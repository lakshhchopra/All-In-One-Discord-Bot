import { AuditLogEvent, EmbedBuilder, Role, PermissionFlagsBits } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";

const DANGEROUS_PERMISSIONS = [
  PermissionFlagsBits.Administrator,
  PermissionFlagsBits.BanMembers,
  PermissionFlagsBits.KickMembers,
  PermissionFlagsBits.ManageGuild,
  PermissionFlagsBits.ManageRoles,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.ManageWebhooks
];

export async function handleRoleUpdate(oldRole: Role, newRole: Role): Promise<void> {
  const guild = newRole.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });
    if (!config || !config.antiNukeEnabled) return;

    // Check Audit Logs for RoleUpdate
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    // Ignore if not fresh
    if (Date.now() - logEntry.createdTimestamp > 10000) return;

    // Ignore if not this role
    if (logEntry.target?.id !== newRole.id) return;

    const executor = logEntry.executor;
    if (!executor || executor.id === guild.client.user?.id) return;

    // Verify if executor is whitelisted
    const whitelisted = await isWhitelisted(guild, executor.id, "role");
    if (whitelisted) return;

    // Check if permissions became dangerous
    const oldPermissions = oldRole.permissions;
    const newPermissions = newRole.permissions;

    let becameDangerous = false;
    for (const perm of DANGEROUS_PERMISSIONS) {
      if (!oldPermissions.has(perm) && newPermissions.has(perm)) {
        becameDangerous = true;
        break;
      }
    }

    // Also block name updates if not whitelisted
    const nameChanged = oldRole.name !== newRole.name;

    if (becameDangerous || nameChanged) {
      // Revert role changes
      await newRole.edit({
        name: oldRole.name,
        permissions: oldRole.permissions,
        color: oldRole.color,
        hoist: oldRole.hoist,
        mentionable: oldRole.mentionable
      });

      await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized role modification" });

      // Save audit log
      await prisma.auditLog.create({
        data: {
          guildId: guild.id,
          userId: executor.id,
          action: "Antinuke Protect: Role Update",
          target: newRole.name,
          reason: `Rogue role modification of @${newRole.name} - Executor Banned & Role Restored.`
        }
      });

      // Send global logs
      const logEmbed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle("🛡️ Anti-Nuke: Role Modification Blocked")
        .setDescription(
          `- **Server:** ${guild.name} (${guild.id})\n` +
          `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
          `- **Role Modified:** @${newRole.name} (${newRole.id}) -> **RESTORED**\n` +
          `- **Reason:** Unauthorized role permissions or name modification.`
        )
        .setTimestamp();

      await sendSupportLog(guild.client, "security", logEmbed);
    }
  } catch (error) {
    console.error("Failed to run Antinuke roleUpdate handler:", error);
  }
}
