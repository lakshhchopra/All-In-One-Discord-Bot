import { AuditLogEvent, EmbedBuilder, Role } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleRoleDelete(role: Role): Promise<void> {
  const guild = role.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });

    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete }).catch(() => null);
    const logEntry = auditLogs?.entries.first();
    const executor = logEntry && (Date.now() - logEntry.createdTimestamp <= 10000) && (logEntry.target?.id === role.id)
      ? logEntry.executor
      : null;

    let isRogue = false;

    if (config && config.antiNukeEnabled && executor && executor.id !== guild.client.user?.id) {
      const whitelisted = await isWhitelisted(guild, executor.id, "role");
      if (!whitelisted) {
        isRogue = true;
        // Rogue role deletion detected! Revert and punish:
        // Recreate role
        await guild.roles.create({
          name: role.name,
          color: role.color,
          hoist: role.hoist,
          permissions: role.permissions,
          mentionable: role.mentionable,
          position: role.position,
          reason: "Antinuke Protection: Reverting unauthorized role deletion"
        }).catch(() => null);

        await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized role deletion" }).catch(() => null);

        await prisma.auditLog.create({
          data: {
            guildId: guild.id,
            userId: executor.id,
            action: "Antinuke Protect: Role Delete",
            target: role.name,
            reason: `Rogue role deletion of @${role.name} - Executor Banned & Role Recreated.`
          }
        });

        const logEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle("🛡️ Anti-Nuke: Role Deletion Blocked")
          .setDescription(
            `- **Server:** ${guild.name} (${guild.id})\n` +
            `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
            `- **Role Deleted:** @${role.name} (${role.id}) -> **RECREATED**\n` +
            `- **Reason:** Unauthorized role deletion.`
          )
          .setTimestamp();

        await sendSupportLog(guild.client, "security", logEmbed);
      }
    }

    if (!isRogue) {
      // Normal Activity Log
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🗑️ Role Deleted")
        .setDescription(
          `• **Role:** \`@${role.name}\`\n` +
          `• **ID:** \`${role.id}\`\n` +
          (executor ? `• **Deleted By:** ${executor} (\`${executor.id}\`)` : `• **Deleted By:** Unknown`)
        )
        .setTimestamp();
      await sendGuildLog(guild, "roles", embed);
    }
  } catch (error) {
    console.error("Failed to run Antinuke roleDelete handler:", error);
  }
}
