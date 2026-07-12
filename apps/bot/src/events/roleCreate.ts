import { AuditLogEvent, EmbedBuilder, Role } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleRoleCreate(role: Role): Promise<void> {
  const guild = role.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });

    // Check Audit Logs for RoleCreate
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleCreate }).catch(() => null);
    const logEntry = auditLogs?.entries.first();
    const executor = logEntry && (Date.now() - logEntry.createdTimestamp <= 10000) && (logEntry.target?.id === role.id)
      ? logEntry.executor
      : null;

    if (config && config.antiNukeEnabled && executor && executor.id !== guild.client.user?.id) {
      const whitelisted = await isWhitelisted(guild, executor.id, "role");
      if (!whitelisted) {
        // Rogue role creation detected! Revert and punish:
        await role.delete("Antinuke Protection: Unauthorized role creation").catch(() => null);
        await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized role creation" }).catch(() => null);

        await prisma.auditLog.create({
          data: {
            guildId: guild.id,
            userId: executor.id,
            action: "Antinuke Protect: Role Create",
            target: role.name,
            reason: `Rogue role creation of @${role.name} - Executor Banned.`
          }
        });

        const logEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle("🛡️ Anti-Nuke: Role Creation Blocked")
          .setDescription(
            `- **Server:** ${guild.name} (${guild.id})\n` +
            `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
            `- **Role Created:** @${role.name} (${role.id}) -> **DELETED**\n` +
            `- **Reason:** Unauthorized role creation.`
          )
          .setTimestamp();

        await sendSupportLog(guild.client, "security", logEmbed);
        return;
      }
    }

    // Normal Activity Log
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🆕 Role Created")
      .setDescription(
        `• **Role:** <@&${role.id}> (\`${role.name}\`)\n` +
        `• **ID:** \`${role.id}\`\n` +
        `• **Color:** \`${role.hexColor}\`\n` +
        (executor ? `• **Created By:** ${executor} (\`${executor.id}\`)` : `• **Created By:** Unknown`)
      )
      .setTimestamp();
    await sendGuildLog(guild, "roles", embed);
  } catch (error) {
    console.error("Failed to run Antinuke roleCreate handler:", error);
  }
}
