import { AuditLogEvent, EmbedBuilder, GuildChannel } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";

export async function handleChannelCreate(channel: GuildChannel): Promise<void> {
  const guild = channel.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });
    if (!config || !config.antiNukeEnabled) return;

    // Check Audit Logs for ChannelCreate
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelCreate });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    // Ignore if not fresh
    if (Date.now() - logEntry.createdTimestamp > 10000) return;

    // Ignore if not this channel
    if (logEntry.target?.id !== channel.id) return;

    const executor = logEntry.executor;
    if (!executor || executor.id === guild.client.user?.id) return;

    // Verify if executor is whitelisted
    const whitelisted = await isWhitelisted(guild, executor.id, "channel");
    if (whitelisted) return;

    // Rogue channel creation detected! Revert and punish:
    await channel.delete("Antinuke Protection: Unauthorized channel creation");
    await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized channel creation" });

    // Save audit log
    await prisma.auditLog.create({
      data: {
        guildId: guild.id,
        userId: executor.id,
        action: "Antinuke Protect: Channel Create",
        target: channel.name,
        reason: `Rogue channel creation of #${channel.name} - Executor Banned.`
      }
    });

    // Send global logs
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
  } catch (error) {
    console.error("Failed to run Antinuke channelCreate handler:", error);
  }
}
