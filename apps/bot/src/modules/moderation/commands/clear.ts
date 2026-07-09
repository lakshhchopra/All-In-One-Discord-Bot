import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { bulkDeleteFiltered, getTextChannel } from "../purgeHelper.js";

export const clearCommand: Command = {
  name: "clear",
  aliases: ["purge", "c"],
  description: "Delete a specified number of messages (1–100) from this channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "clear <amount>",
  examples: ["clear 50", "clear 10"],
  execute: async (ctx) => {
    const ch = getTextChannel(ctx.channel);
    if (!ch) return ctx.reply({ embeds: [UniversalEmbed.error("This channel does not support bulk deletion.", ctx.guild)] }, 5);

    const amount = parseInt(ctx.args[0], 10);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a number between **1** and **100**.", ctx.guild)] }, 5);
    }

    try {
      const fetched = await ch.messages.fetch({ limit: amount });
      const deleted = await ch.bulkDelete(fetched, true);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🗑️ Deleted **${deleted.size}** messages.`, ctx.guild)] }, 5);
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed. Messages older than 14 days cannot be bulk deleted.", ctx.guild)] }, 5);
    }
  }
};
