import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listboostersCommand: Command = {
  name: "listboosters",
  aliases: ["list boosters", "listboosts"],
  description: "List all active server boosters.",
  category: "General Commands",
  usage: "listboosters",
  examples: ["listboosters"],
  execute: async (ctx) => {
    const boosters = ctx.guild.members.cache.filter(m => m.premiumSinceTimestamp !== null);
    const description = boosters
      .map(m => `• **${m.user.tag}** (Since <t:${Math.floor(m.premiumSinceTimestamp! / 1000)}:R>)`)
      .slice(0, 30)
      .join("\n") || "No active boosters.";

    const embed = UniversalEmbed.neutral("Active Boosters", ctx.guild)
      .setDescription(description)
      .setFooter({ text: `Total Boosters: ${boosters.size}` });

    return ctx.reply({ embeds: [embed] });
  }
};
