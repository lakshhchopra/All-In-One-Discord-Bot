import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listactivedeveloperCommand: Command = {
  name: "listactivedeveloper",
  aliases: ["list activedeveloper"],
  description: "List all active developers in the server.",
  category: "General Commands",
  usage: "listactivedeveloper",
  examples: ["listactivedeveloper"],
  execute: async (ctx) => {
    // Requires OAuth2 indexing fallback
    const embed = UniversalEmbed.neutral("Active Developers List", ctx.guild)
      .setDescription("This user list filter requires OAuth2 indexing which is currently not syncable.");
    return ctx.reply({ embeds: [embed] });
  }
};
