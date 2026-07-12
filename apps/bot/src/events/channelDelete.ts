import { DMChannel, NonThreadGuildBasedChannel, ChannelType, AuditLogEvent, EmbedBuilder } from "discord.js";
import { prisma } from "../services/db.js";
import { isWhitelisted } from "../utils/security.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleChannelDelete(channel: DMChannel | NonThreadGuildBasedChannel) {
  if (channel.type === ChannelType.DM) return;

  const guildChannel = channel as NonThreadGuildBasedChannel;
  const channelName = guildChannel.name || "Unknown Channel";
  const guild = guildChannel.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });

    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete }).catch(() => null);
    const logEntry = auditLogs?.entries.first();
    const executor = logEntry && (Date.now() - logEntry.createdTimestamp <= 10000) && (logEntry.target?.id === guildChannel.id)
      ? logEntry.executor
      : null;

    let isRogue = false;

    if (config && config.antiNukeEnabled && executor && executor.id !== guild.client.user?.id) {
      const whitelisted = await isWhitelisted(guild, executor.id, "channel");
      if (!whitelisted) {
        isRogue = true;
        // Rogue delete! Recreate channel and ban executor
        try {
          const type = guildChannel.type;
          const parent = guildChannel.parentId;
          const permissionOverwrites = guildChannel.permissionOverwrites?.cache.map(overwrite => ({
            id: overwrite.id,
            type: overwrite.type,
            allow: overwrite.allow,
            deny: overwrite.deny
          }));

          await guild.channels.create({
            name: guildChannel.name,
            type: type as any,
            parent,
            permissionOverwrites,
            reason: "Antinuke Protection: Reverting unauthorized channel delete"
          });

          await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized channel deletion" }).catch(() => null);

          await prisma.auditLog.create({
            data: {
              guildId: guild.id,
              userId: executor.id,
              action: "Antinuke Protect: Channel Delete",
              target: channelName,
              reason: `Rogue channel deletion of #${channelName} - Executor Banned & Channel Recreated.`
            }
          });

          const logEmbed = new EmbedBuilder()
            .setColor(0xFF0000)
            .setTitle("🛡️ Anti-Nuke: Channel Deletion Blocked")
            .setDescription(
              `- **Server:** ${guild.name} (${guild.id})\n` +
              `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
              `- **Channel Deleted:** #${channelName} (${guildChannel.id}) -> **RECREATED**\n` +
              `- **Reason:** Unauthorized channel deletion.`
            )
            .setTimestamp();

          await sendSupportLog(guild.client, "security", logEmbed);
        } catch (recreateErr) {
          console.error("Failed to recreate deleted channel:", recreateErr);
        }
      }
    }

    // Delete Temp VC Generator if match
    await (prisma as any).tempVCGenerator?.deleteMany({
      where: { channelId: guildChannel.id }
    }).catch(() => null);

    // Delete active Temp VC if match
    await prisma.tempVC.deleteMany({
      where: { channelId: guildChannel.id }
    }).catch(() => null);

    if (!isRogue) {
      // Normal Activity Log
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setTitle("🗑️ Channel Deleted")
        .setDescription(
          `> **Channel:** \`#${channelName}\`\n` +
          `> **ID:** \`${guildChannel.id}\`\n` +
          `> **Type:** \`${guildChannel.type}\`\n` +
          (executor ? `> **Deleted By:** ${executor} (\`${executor.id}\`)` : `> **Deleted By:** Unknown`)
        )
        .setTimestamp();
      await sendGuildLog(guild, "channels", embed);
    }
  } catch (err) {
    console.error("❌ Error in handleChannelDelete event:", err);
  }
}
