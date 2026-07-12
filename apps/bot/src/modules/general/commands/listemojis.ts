import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listemojisCommand: Command = {
  name: "listemojis",
  aliases: ["list emojis"],
  description: "List all custom emojis in this server.",
  category: "General Commands",
  usage: "listemojis",
  examples: ["listemojis"],
  execute: async (ctx) => {
    const emojis = ctx.guild.emojis.cache.map(e => `${e} | \`:${e.name}:\` (${e.id})`).slice(0, 20).join("\n") +
      (ctx.guild.emojis.cache.size > 20 ? "\n... and more" : "");

    const embed = UniversalEmbed.neutral("Server Emojis", ctx.guild)
      .setDescription(emojis || "No custom emojis configured.")
      .setFooter({ text: `Total Emojis: ${ctx.guild.emojis.cache.size}` });

    return ctx.reply({ embeds: [embed] });
  }
};
