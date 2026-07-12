import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { bulkDeleteFiltered, getTextChannel } from "../../purgeHelper.js";

export const clearembedCommand: Command = {
  name: "clearembed",
  aliases: ["clear embed", "clear embeds"],
  description: "Delete messages that contain embeds.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "clearembed [amount]",
  examples: ["clearembed", "clearembed 30"],
  execute: async (ctx) => {
    const ch = getTextChannel(ctx.channel);
    if (!ch) return ctx.reply({ embeds: [UniversalEmbed.error("This channel does not support bulk deletion.", ctx.guild)] }, 5);

    const amount = parseInt(ctx.args[0] || "100", 10);
    const safe = isNaN(amount) ? 100 : Math.min(Math.max(amount, 1), 100);

    try {
      const count = await bulkDeleteFiltered(ch, safe, (m: any) => m.embeds.length > 0);
      if (count === 0) return ctx.reply({ embeds: [UniversalEmbed.info("No embed messages found to delete.", ctx.guild)] }, 5);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🗑️ Deleted **${count}** embed messages.`, ctx.guild)] }, 5);
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed. Messages older than 14 days cannot be bulk deleted.", ctx.guild)] }, 5);
    }
  }
};
