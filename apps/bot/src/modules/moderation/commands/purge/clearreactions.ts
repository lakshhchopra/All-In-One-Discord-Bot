import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { getTextChannel } from "../../purgeHelper.js";

export const clearreactionsCommand: Command = {
  name: "clearreactions",
  aliases: ["clear reactions", "clear reaction"],
  description: "Remove all reactions from recent messages in this channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "clearreactions [amount]",
  examples: ["clearreactions", "clearreactions 50"],
  execute: async (ctx) => {
    const ch = getTextChannel(ctx.channel);
    if (!ch) return ctx.reply({ embeds: [UniversalEmbed.error("This channel does not support this action.", ctx.guild)] }, 5);

    const amount = parseInt(ctx.args[0] || "100", 10);
    const safe = isNaN(amount) ? 100 : Math.min(Math.max(amount, 1), 100);

    const messages = await ch.messages.fetch({ limit: safe });
    let count = 0;
    for (const msg of messages.values()) {
      if (msg.reactions.cache.size > 0) {
        await msg.reactions.removeAll().catch(() => null);
        count++;
      }
    }

    return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Cleared reactions from **${count}** messages.`, ctx.guild)] }, 5);
  }
};
