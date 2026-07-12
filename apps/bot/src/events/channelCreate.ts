import { AuditLogEvent, EmbedBuilder, GuildChannel } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleChannelCreate(channel: GuildChannel): Promise<void> {
  const guild = channel.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });

    // Check Audit Logs for ChannelCreate
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate }).catch(() => null);
    const logEntry = auditLogs?.entries.first();
    const executor = logEntry && (Date.now() - logEntry.createdTimestamp <= 10000) && (logEntry.target?.id === channel.id)
      ? logEntry.executor
      : null;

    if (config && config.antiNukeEnabled && executor && executor.id !== guild.client.user?.id) {
      const whitelisted = await isWhitelisted(guild, executor.id, "channel");
      if (!whitelisted) {
        // Rogue channel creation detected! Revert and punish:
        await channel.delete("Antinuke Protection: Unauthorized channel creation").catch(() => null);
        await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized channel creation" }).catch(() => null);

        await prisma.auditLog.create({
          data: {
            guildId: guild.id,
            userId: executor.id,
            action: "Antinuke Protect: Channel Create",
            target: channel.name,
            reason: `Rogue channel creation of #${channel.name} - Executor Banned.`
          }
        });

        const logEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle("🛡️ Anti-Nuke: Channel Creation Blocked")
          .setDescription(
            `- **Server:** ${guild.name} (${guild.id})\n` +
            `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
            `- **Channel Created:** #${channel.name} (${channel.id}) -> **DELETED**\n` +
            `- **Reason:** Unauthorized channel creation.`
          )
          .setTimestamp();

        await sendSupportLog(guild.client, "security", logEmbed);
        return;
      }
    }

    // Normal Activity Log
    const embed = new EmbedBuilder()
      .setColor(0x2ecc71)
      .setTitle("🆕 Channel Created")
      .setDescription(
        `• **Channel:** <#${channel.id}> (\`${channel.name}\`)\n` +
        `• **ID:** \`${channel.id}\`\n` +
        `• **Type:** \`${channel.type}\`\n` +
        (executor ? `• **Created By:** ${executor} (\`${executor.id}\`)` : `• **Created By:** Unknown`)
      )
      .setTimestamp();
    await sendGuildLog(guild, "channels", embed);
  } catch (error) {
    console.error("Failed to run channelCreate handler:", error);
  }
}
