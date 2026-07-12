import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const voteCommand: Command = {
  name: "vote",
  description: "Get the links to vote for the bot and support development.",
  category: "General Commands",
  usage: "vote",
  examples: ["vote"],
  execute: async (ctx) => {
    const embed = UniversalEmbed.neutral("Vote for Gupshup", ctx.guild)
      .setDescription(
        "Thank you for supporting Gupshup! Your votes help us reach more servers and support development.\n\n" +
        "🗳️ **Vote on Top.gg:** [Click here to vote](https://top.gg/bot/gupshup/vote)\n" +
        "🗳️ **Vote on Discord Bot List:** [Click here to vote](https://discordbotlist.com/bots/gupshup/vote)"
      );

    return ctx.reply({ embeds: [embed] });
  }
};
