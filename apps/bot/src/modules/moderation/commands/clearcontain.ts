import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { bulkDeleteFiltered, getTextChannel } from "../purgeHelper.js";

export const clearcontainCommand: Command = {
  name: "clearcontain",
  aliases: ["clear contain", "clear contains"],
  description: "Delete messages that contain a specific keyword or phrase.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "clearcontain <keyword> [amount]",
  examples: ["clearcontain spam", "clearcontain discord.gg 50"],
  execute: async (ctx) => {
    const ch = getTextChannel(ctx.channel);
    if (!ch) return ctx.reply({ embeds: [UniversalEmbed.error("This channel does not support bulk deletion.", ctx.guild)] }, 5);

    const keyword = ctx.args[0];
    if (!keyword) return ctx.wrongUsage(clearcontainCommand);

    const amount = parseInt(ctx.args[1] || "100", 10);
    const safe = isNaN(amount) ? 100 : Math.min(Math.max(amount, 1), 100);

    try {
      const count = await bulkDeleteFiltered(ch, safe, m => m.content.toLowerCase().includes(keyword.toLowerCase()));
      if (count === 0) return ctx.reply({ embeds: [UniversalEmbed.info(`No messages containing **"${keyword}"** found.`, ctx.guild)] }, 5);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🗑️ Deleted **${count}** messages containing **"${keyword}"**.`, ctx.guild)] }, 5);
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed. Messages older than 14 days cannot be bulk deleted.", ctx.guild)] }, 5);
    }
  }
};
