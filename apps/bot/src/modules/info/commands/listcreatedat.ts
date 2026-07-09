import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listcreatedatCommand: Command = {
  name: "listcreatedat",
  aliases: ["list createdat"],
  description: "List oldest member accounts in the server based on account creation date.",
  category: "General Commands",
  usage: "listcreatedat",
  examples: ["listcreatedat"],
  execute: async (ctx) => {
    const sorted = [...ctx.guild.members.cache.values()]
      .sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp)
      .slice(0, 15);

    const description = sorted
      .map((m, idx) => `${idx + 1}. **${m.user.tag}** (Created <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>)`)
      .join("\n");

    const embed = UniversalEmbed.neutral("Oldest Accounts", ctx.guild)
      .setDescription(description);

    return ctx.reply({ embeds: [embed] });
  }
};
