import { GuildMember, EmbedBuilder } from "discord.js";
import { prisma } from "../services/db.js";
import { parseVariables } from "../services/utils/parser.js";
import { parseFunctions, executeSend } from "../services/utils/placeholder.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
  const guild = newMember.guild;

  // Boost Detection
  const oldPremium = oldMember.premiumSince;
  const newPremium = newMember.premiumSince;

  if (!oldPremium && newPremium) {
    try {
      const config = await prisma.guildConfig.findUnique({
        where: { guildId: guild.id }
      });

      if (config && config.boostChannelId) {
        const ch = guild.channels.cache.get(config.boostChannelId);
        if (ch && "send" in ch) {
          const template = config.boostMessage || "Thanks {user} for boosting {server}!";
          const parserCtx = { user: newMember, guild };
          const parsedMessage = parseVariables(template, parserCtx);
          const finalPayload = await parseFunctions(parsedMessage, guild.id, parserCtx);
          await executeSend(ch, finalPayload, newMember, guild);
        }
      }
    } catch (err) {
      console.error("Failed to process boost greeting:", err);
    }
  }

  // Nickname Change
  if (oldMember.nickname !== newMember.nickname) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle("✏️ Member Nickname Changed")
        .setDescription(
          `> **Member:** ${newMember} (${newMember.user.tag})\n` +
          `> **ID:** \`${newMember.id}\`\n` +
          `> **Before:** ${oldMember.nickname || "*None*"}\n` +
          `> **After:** ${newMember.nickname || "*None*"}`
        )
        .setTimestamp();
      await sendGuildLog(guild, "users", embed);
    } catch (err) {
      console.error("Failed nickname log:", err);
    }
  }

  // Role Changes
  const oldRoles = oldMember.roles.cache;
  const newRoles = newMember.roles.cache;

  if (oldRoles.size !== newRoles.size) {
    try {
      const addedRoles = newRoles.filter(role => !oldRoles.has(role.id));
      const removedRoles = oldRoles.filter(role => !newRoles.has(role.id));

      if (addedRoles.size > 0) {
        const embed = new EmbedBuilder()
          .setColor(0x2ecc71)
          .setTitle("🛡️ Member Roles Added")
          .setDescription(
            `> **Member:** ${newMember} (${newMember.user.tag})\n` +
            `> **ID:** \`${newMember.id}\`\n` +
            `> **Added Role(s):** ${addedRoles.map(r => `<@&${r.id}>`).join(", ")}`
          )
          .setTimestamp();
        await sendGuildLog(guild, "users", embed);
      }

      if (removedRoles.size > 0) {
        const embed = new EmbedBuilder()
          .setColor(0xe74c3c)
          .setTitle("🛡️ Member Roles Removed")
          .setDescription(
            `> **Member:** ${newMember} (${newMember.user.tag})\n` +
            `> **ID:** \`${newMember.id}\`\n` +
            `> **Removed Role(s):** ${removedRoles.map(r => `<@&${r.id}>`).join(", ")}`
          )
          .setTimestamp();
        await sendGuildLog(guild, "users", embed);
      }
    } catch (err) {
      console.error("Failed role change log:", err);
    }
  }
}
