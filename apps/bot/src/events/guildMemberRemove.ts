import { AuditLogEvent, EmbedBuilder, GuildMember, PartialGuildMember } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { parseVariables, parseObjectVariables } from "../services/utils/parser.js";
import { parseEmbedPlaceholder } from "../services/utils/placeholder.js";

export async function handleGuildMemberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
  const guild = member.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });

    if (config) {
      const cfg = config as any;
      // Send leave message if configured
      if (cfg.leaveChannelId) {
        try {
          const ch = guild.channels.cache.get(cfg.leaveChannelId);
          if (ch && "send" in ch) {
            const template = cfg.leaveMessage || "Goodbye {user}!";
            const parsedMessage = parseVariables(template, { user: member as any, guild });

            let sendPayload: any = {};

            if (parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:")) {
              const res = await parseEmbedPlaceholder(parsedMessage, guild.id);
              let embeds = res.embeds || [];
              if (embeds.length > 0) {
                embeds = embeds.map(emb => parseObjectVariables(emb, { user: member as any, guild }));
              }
              sendPayload = {
                content: res.content || undefined,
                embeds
              };
            } else {
              sendPayload = { content: parsedMessage };
            }

            await (ch as any).send(sendPayload);
          }
        } catch (leaveErr) {
          console.error("Failed to send leave message:", leaveErr);
        }
      }

      if (!config.antiNukeEnabled) return;
    } else {
      return;
    }

    // Check Audit Logs for MemberKick
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberKick });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    // Ignore if not a fresh log (within 10s)
    if (Date.now() - logEntry.createdTimestamp > 10000) return;

    // Ignore if log target is not this member
    if (logEntry.target?.id !== member.id) return;

    const executor = logEntry.executor;
    if (!executor || executor.id === guild.client.user?.id) return;

    // Verify if executor is whitelisted
    const whitelisted = await isWhitelisted(guild, executor.id, "kick");
    if (whitelisted) return;

    // Rogue kick detected! Punish:
    await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized kick action" });

    // Save audit log
    await prisma.auditLog.create({
      data: {
        guildId: guild.id,
        userId: executor.id,
        action: "Antinuke Protect: Rogue Kick",
        target: member.id,
        reason: `Rogue kick trigger on ${member.user?.tag} - Executor Banned.`
      }
    });

    // Send global logs
    const logEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("🛡️ Anti-Nuke: Rogue Kick Blocked")
      .setDescription(
        `- **Server:** ${guild.name} (${guild.id})\n` +
        `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
        `- **Victim:** ${member.user?.tag || member.id} (${member.id})\n` +
        `- **Reason:** Direct unauthorized member kick.`
      )
      .setTimestamp();

    await sendSupportLog(guild.client, "security", logEmbed);
  } catch (error) {
    console.error("Failed to run Antinuke guildMemberRemove handler:", error);
  }
}
