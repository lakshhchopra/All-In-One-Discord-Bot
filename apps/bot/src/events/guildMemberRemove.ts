import { AuditLogEvent, EmbedBuilder, GuildMember, PartialGuildMember } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { parseVariables } from "../services/utils/parser.js";
import { parseFunctions, executeSend } from "../services/utils/placeholder.js";
import { trackMemberLeave } from "../services/invites.js";

export async function handleGuildMemberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
  const guild = member.guild;

  if (!member.partial) {
    await trackMemberLeave(member as GuildMember).catch(() => null);
  }

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
            const parserCtx = { user: member as any, guild };
            const parsedMessage = parseVariables(template, parserCtx);
            const finalPayload = await parseFunctions(parsedMessage, guild.id, parserCtx);
            await executeSend(ch, finalPayload, member, guild);
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
