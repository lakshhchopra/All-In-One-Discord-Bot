import { AuditLogEvent, EmbedBuilder, Role } from "discord.js";
import { isWhitelisted } from "../utils/security.js";
import { prisma } from "../services/db.js";
import { sendSupportLog } from "../utils/supportLogger.js";

export async function handleRoleDelete(role: Role): Promise<void> {
  const guild = role.guild;

  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });
    if (!config || !config.antiNukeEnabled) return;

    // Check Audit Logs for RoleDelete
    const auditLogs = await guild.fetchAuditLogs({ limit: 1, type: AuditLogEvent.RoleDelete });
    const logEntry = auditLogs.entries.first();
    if (!logEntry) return;

    // Ignore if not fresh
    if (Date.now() - logEntry.createdTimestamp > 10000) return;

    // Ignore if not this role
    if (logEntry.target?.id !== role.id) return;

    const executor = logEntry.executor;
    if (!executor || executor.id === guild.client.user?.id) return;

    // Verify if executor is whitelisted
    const whitelisted = await isWhitelisted(guild, executor.id, "role");
    if (whitelisted) return;

    // Rogue role deletion detected! Revert and punish:
    // Recreate role
    await guild.roles.create({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      permissions: role.permissions,
      mentionable: role.mentionable,
      position: role.position,
      reason: "Antinuke Protection: Reverting unauthorized role deletion"
    });

    await guild.members.ban(executor.id, { reason: "Antinuke Protection: Unauthorized role deletion" });

    // Save audit log
    await prisma.auditLog.create({
      data: {
        guildId: guild.id,
        userId: executor.id,
        action: "Antinuke Protect: Role Delete",
        target: role.name,
        reason: `Rogue role deletion of @${role.name} - Executor Banned & Role Recreated.`
      }
    });

    // Send global logs
    const logEmbed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle("🛡️ Anti-Nuke: Role Deletion Blocked")
      .setDescription(
        `- **Server:** ${guild.name} (${guild.id})\n` +
        `- **Rogue Mod:** ${executor.tag} (${executor.id}) -> **BANNED**\n` +
        `- **Role Deleted:** @${role.name} (${role.id}) -> **RECREATED**\n` +
        `- **Reason:** Unauthorized role deletion.`
      )
      .setTimestamp();

    await sendSupportLog(guild.client, "security", logEmbed);
  } catch (error) {
    console.error("Failed to run Antinuke roleDelete handler:", error);
  }
}
