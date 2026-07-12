import { AuditLogEvent, EmbedBuilder, GuildBan } from "discord.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleGuildBanRemove(ban: GuildBan): Promise<void> {
  const guild = ban.guild;

  try {
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanRemove }).catch(() => null);
    const logEntry = auditLogs?.entries.first();
    const executor = logEntry && (Date.now() - logEntry.createdTimestamp <= 10000) && (logEntry.target?.id === ban.user.id)
      ? logEntry.executor
      : null;

    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setAuthor({
        name: ban.user.tag,
        iconURL: ban.user.displayAvatarURL({ extension: "png" })
      })
      .setTitle("🔓 Member Unbanned")
      .setDescription(
        `> **User:** ${ban.user} (\`${ban.user.id}\`)\n` +
        (executor ? `> **Unbanned By:** ${executor} (\`${executor.id}\`)` : `> **Unbanned By:** Unknown`)
      )
      .setFooter({ text: `User ID: ${ban.user.id}` })
      .setTimestamp();
    await sendGuildLog(guild, "moderation", embed);
  } catch (error) {
    console.error("Failed to run guildBanRemove handler:", error);
  }
}
