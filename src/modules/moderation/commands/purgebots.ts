import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const purgebotsCommand: Command = {
  name: "purgebots",
  description: "Purge bot messages from the channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "purgebots <amount>",
  examples: ["purgebots 20"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Messages`", ctx.guild)] }, 5);
    }

    const amount = parseInt(ctx.args[0], 10);
    if (isNaN(amount) || amount < 1 || amount > 100) return ctx.wrongUsage(purgebotsCommand);

    let messages = await ctx.channel.messages.fetch({ limit: amount });
    messages = messages.filter(m => m.author.bot);

    if (ctx.channel.isTextBased() && "bulkDelete" in ctx.channel) {
      await ctx.channel.bulkDelete(messages, true);
    }

    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully removed **${messages.size}** bot messages`, ctx.guild)] }, 5);
  }
};
