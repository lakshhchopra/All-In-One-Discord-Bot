import { DMChannel, NonThreadGuildBasedChannel, ChannelType, AuditLogEvent, EmbedBuilder } from "discord.js";
import { prisma } from "../services/db.js";
import { isWhitelisted } from "../utils/security.js";
import { sendSupportLog } from "../utils/supportLogger.js";

export async function handleChannelDelete(channel: DMChannel | NonThreadGuildBasedChannel) {
  if (channel.type === ChannelType.DM) return;

  const guildChannel = channel as NonThreadGuildBasedChannel;
  const channelName = guildChannel.name || "Unknown Channel";
  const guild = guildChannel.guild;

  try {
    // 1. Antinuke Check
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });

    if (config && config.antiNukeEnabled) {
      const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.ChannelDelete });
      const logEntry = auditLogs.entries.first();
      
      if (logEntry && Date.now() - logEntry.createdTimestamp <= 10000 && logEntry.target?.id === guildChannel.id) {
        const executor = logEntry.executor;
        if (executor && executor.id !== guild.client.user?.id) {
          const whitelisted = await isWhitelisted(guild, executor.id, "channel");
          if (!whitelisted) {
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

              await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized channel deletion" });

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
      }
    }

    // 2. Delete Temp VC Generator if match
    const genDelete = await (prisma as any).tempVCGenerator.deleteMany({
      where: { channelId: guildChannel.id }
    });
    if (genDelete.count > 0) {
      console.log(`🗑️ Deleted TempVC Generator channel ${channelName} (${guildChannel.id}) from DB.`);
    }

    // 3. Delete active Temp VC if match
    const vcDelete = await prisma.tempVC.deleteMany({
      where: { channelId: guildChannel.id }
    });
    if (vcDelete.count > 0) {
      console.log(`🗑️ Deleted active TempVC channel ${channelName} (${guildChannel.id}) from DB.`);
    }
  } catch (err) {
    console.error("❌ Error in handleChannelDelete event:", err);
  }
}
