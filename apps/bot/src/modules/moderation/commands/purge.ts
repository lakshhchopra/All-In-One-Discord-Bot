import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const purgeCommand: Command = {
  name: "purge",
  description: "Purge messages from a channel (optional user filter).",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "purge <amount> [member]",
  examples: ["purge 20", "purge 10 @member"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Messages`", ctx.guild)] }, 5);
    }

    const isBots = ctx.args[0] === "bots" || ctx.args[0] === "bot";
    let amount = isBots ? parseInt(ctx.args[1], 10) : parseInt(ctx.args[0], 10);
    const targetUser = ctx.getMemberOption("user", 1) || ctx.getMemberOption("member", 1);

    if (isNaN(amount) || amount < 1 || amount > 100) {
      return ctx.wrongUsage(purgeCommand);
    }

    let messages = await ctx.channel.messages.fetch({ limit: amount });

    if (isBots) {
      messages = messages.filter(m => m.author.bot);
    } else if (targetUser) {
      messages = messages.filter(m => m.author.id === targetUser.id);
    }

    if (ctx.channel.isTextBased() && "bulkDelete" in ctx.channel) {
      await ctx.channel.bulkDelete(messages, true);
    }

    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully removed **${messages.size}** messages`, ctx.guild)] }, 5);
  }
};
