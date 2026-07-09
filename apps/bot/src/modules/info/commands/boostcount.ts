import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const boostcountCommand: Command = {
  name: "boostcount",
  description: "Display the number of boosts and the boost level of the server.",
  category: "General Commands",
  usage: "boostcount",
  aliases: ["bc"],
  examples: ["boostcount"],
  execute: async (ctx) => {
    const boostCount = ctx.guild.premiumSubscriptionCount || 0;
    const tier = ctx.guild.premiumTier;

    const embed = UniversalEmbed.neutral("Server Boost Details", ctx.guild)
      .setDescription(
        `✨ **Total Boosts:** \`${boostCount}\`\n` +
        `📈 **Server Tier:** \`Tier ${tier}\``
      );

    return ctx.reply({ embeds: [embed] });
  }
};
