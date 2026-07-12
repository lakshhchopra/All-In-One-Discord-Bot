import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listbughuntersCommand: Command = {
  name: "listbughunters",
  aliases: ["list bughunters"],
  description: "List Discord Bug Hunters in the server (placeholder/OAuth2 restricted).",
  category: "General Commands",
  usage: "listbughunters",
  examples: ["listbughunters"],
  execute: async (ctx) => {
    const embed = UniversalEmbed.neutral("Bug Hunters", ctx.guild)
      .setDescription("This user list filter requires OAuth2 indexing which is currently not syncable.");
    return ctx.reply({ embeds: [embed] });
  }
};
