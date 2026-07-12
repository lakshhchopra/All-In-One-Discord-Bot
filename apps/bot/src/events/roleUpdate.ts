import { AuditLogEvent, EmbedBuilder, Role, PermissionFlagsBits } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { sendGuildLog } from "../services/logger.js";

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

    // Check Audit Logs for RoleUpdate
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleUpdate }).catch(() => null);
    const logEntry = auditLogs?.entries.first();
    const executor = logEntry && (Date.now() - logEntry.createdTimestamp <= 10000) && (logEntry.target?.id === newRole.id)
      ? logEntry.executor
      : null;

    let isRogue = false;

    if (config && config.antiNukeEnabled && executor && executor.id !== guild.client.user?.id) {
      const whitelisted = await isWhitelisted(guild, executor.id, "role");
      if (!whitelisted) {
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

        const nameChanged = oldRole.name !== newRole.name;

        if (becameDangerous || nameChanged) {
          isRogue = true;
          // Revert role changes
          await newRole.edit({
            name: oldRole.name,
            permissions: oldRole.permissions,
            color: oldRole.color,
            hoist: oldRole.hoist,
            mentionable: oldRole.mentionable
          }).catch(() => null);

          await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized role modification" }).catch(() => null);

          await prisma.auditLog.create({
            data: {
              guildId: guild.id,
              userId: executor.id,
              action: "Antinuke Protect: Role Update",
              target: newRole.name,
              reason: `Rogue role modification of @${newRole.name} - Executor Banned & Role Restored.`
            }
          });

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
      }
    }

    if (!isRogue) {
      // Normal Activity Log
      const changes: string[] = [];
      if (oldRole.name !== newRole.name) changes.push(`• **Name:** \`${oldRole.name}\` ➔ \`${newRole.name}\``);
      if (oldRole.hexColor !== newRole.hexColor) changes.push(`• **Color:** \`${oldRole.hexColor}\` ➔ \`${newRole.hexColor}\``);
      if (oldRole.hoist !== newRole.hoist) changes.push(`• **Hoist:** \`${oldRole.hoist}\` ➔ \`${newRole.hoist}\``);
      if (oldRole.mentionable !== newRole.mentionable) changes.push(`• **Mentionable:** \`${oldRole.mentionable}\` ➔ \`${newRole.mentionable}\``);
      if (!oldRole.permissions.equals(newRole.permissions)) changes.push(`• **Permissions Updated**`);

      if (changes.length > 0) {
        const embed = new EmbedBuilder()
          .setColor(0xf1c40f)
          .setTitle("✏️ Role Updated")
          .setDescription(
            `• **Role:** <@&${newRole.id}> (\`${newRole.name}\`)\n` +
            `• **ID:** \`${newRole.id}\`\n` +
            `**Changes:**\n${changes.join("\n")}\n` +
            (executor ? `• **Updated By:** ${executor} (\`${executor.id}\`)` : `• **Updated By:** Unknown`)
          )
          .setTimestamp();
        await sendGuildLog(guild, "roles", embed);
      }
    }
  } catch (error) {
    console.error("Failed to run Antinuke roleUpdate handler:", error);
  }
}
