import { AuditLogEvent, EmbedBuilder, GuildBan } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";

export async function handleGuildBanAdd(ban: GuildBan): Promise<void> {
  const guild = ban.guild;

  try {
    // 1. Fetch anti-nuke configuration
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });
    if (!config || !config.antiNukeEnabled) return;

    // 2. Fetch executor from Audit Logs
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    // Ignore if not a fresh log (within 10s)
    if (Date.now() - logEntry.createdTimestamp > 10000) return;

    const executor = logEntry.executor;
    if (!executor || executor.id === guild.client.user?.id) return;

    // 3. Verify if executor is whitelisted
    const whitelisted = await isWhitelisted(guild, executor.id, "ban");
    if (whitelisted) return;

    // rogue executor detected! Revert and punish:
    // A. Unban victim
    await guild.members.unban(ban.user, "Antinuke Protection: Unauthorized Ban Reverted");

    // B. Ban executor
    await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized ban action" });

    // C. Save audit log
    await prisma.auditLog.create({
      data: {
        guildId: guild.id,
        userId: executor.id,
        action: "Antinuke Protect: Rogue Ban",
        target: ban.user.id,
        reason: `Rogue ban trigger on ${ban.user.tag} - Executor Banned.`
      }
    });

    // D. Send global logs
    const logEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("🛡️ Anti-Nuke: Rogue Ban Blocked")
      .setDescription(
        `- **Server:** ${guild.name} (${guild.id})\n` +
        `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
        `- **Victim:** ${ban.user.tag} (${ban.user.id}) -> **UNBANNED**\n` +
        `- **Reason:** Direct unauthorized ban.`
      )
      .setTimestamp();

    await sendSupportLog(guild.client, "security", logEmbed);
  } catch (error) {
    console.error("Failed to run Antinuke guildBanAdd handler:", error);
  }
}
