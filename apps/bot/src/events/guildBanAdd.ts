import { AuditLogEvent, EmbedBuilder, GuildBan } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleGuildBanAdd(ban: GuildBan): Promise<void> {
  const guild = ban.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });

    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.MemberBanAdd }).catch(() => null);
    const logEntry = auditLogs?.entries.first();
    const executor = logEntry && (Date.now() - logEntry.createdTimestamp <= 10000) && (logEntry.target?.id === ban.user.id)
      ? logEntry.executor
      : null;

    let isRogue = false;

    if (config && config.antiNukeEnabled && executor && executor.id !== guild.client.user?.id) {
      const whitelisted = await isWhitelisted(guild, executor.id, "ban");
      if (!whitelisted) {
        isRogue = true;
        await guild.members.unban(ban.user, "Antinuke Protection: Unauthorized Ban Reverted").catch(() => null);
        await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized ban action" }).catch(() => null);

        await prisma.auditLog.create({
          data: {
            guildId: guild.id,
            userId: executor.id,
            action: "Antinuke Protect: Rogue Ban",
            target: ban.user.id,
            reason: `Rogue ban trigger on ${ban.user.tag} - Executor Banned.`
          }
        });

        const logEmbed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle("🛡️ Anti-Nuke: Rogue Ban Blocked")
          .setDescription(
            `> **Server:** ${guild.name} (\`${guild.id}\`)\n` +
            `> **Rogue Mod:** ${executor.tag} (\`${executor.id}\`) → **BANNED**\n` +
            `> **Victim:** ${ban.user.tag} (\`${ban.user.id}\`) → **UNBANNED**\n` +
            `> **Reason:** Unauthorized ban detected and reverted.`
          )
          .setTimestamp();

        await sendSupportLog(guild.client, "security", logEmbed);
      }
    }

    if (!isRogue) {
      const embed = new EmbedBuilder()
        .setColor(0xe74c3c)
        .setAuthor({
          name: ban.user.tag,
          iconURL: ban.user.displayAvatarURL({ extension: "png" })
        })
        .setTitle("🔨 Member Banned")
        .setDescription(
          `> **User:** ${ban.user} (\`${ban.user.id}\`)\n` +
          `> **Reason:** ${ban.reason || "*No reason specified*"}\n` +
          (executor ? `> **Banned By:** ${executor} (\`${executor.id}\`)` : `> **Banned By:** Unknown`)
        )
        .setFooter({ text: `User ID: ${ban.user.id}` })
        .setTimestamp();
      await sendGuildLog(guild, "moderation", embed);
    }
  } catch (error) {
    console.error("Failed to run Antinuke guildBanAdd handler:", error);
  }
}
