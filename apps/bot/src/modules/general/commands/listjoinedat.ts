import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listjoinedatCommand: Command = {
  name: "listjoinedat",
  aliases: ["list joinedat"],
  description: "List members ordered by server join date.",
  category: "General Commands",
  usage: "listjoinedat",
  examples: ["listjoinedat"],
  execute: async (ctx) => {
    const sorted = [...ctx.guild.members.cache.values()]
      .sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0))
      .slice(0, 15);

    const description = sorted
      .map((m, idx) => `${idx + 1}. **${m.user.tag}** (Joined <t:${Math.floor((m.joinedTimestamp || 0) / 1000)}:D>)`)
      .join("\n");

    const embed = UniversalEmbed.neutral("Oldest Server Members", ctx.guild)
      .setDescription(description);

    return ctx.reply({ embeds: [embed] });
  }
};
