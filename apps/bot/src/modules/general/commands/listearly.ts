import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listearlyCommand: Command = {
  name: "listearly",
  aliases: ["list early"],
  description: "List early members in the server (placeholder/OAuth2 restricted).",
  category: "General Commands",
  usage: "listearly",
  examples: ["listearly"],
  execute: async (ctx) => {
    const embed = UniversalEmbed.neutral("Early Members List", ctx.guild)
      .setDescription("This user list filter requires OAuth2 indexing which is currently not syncable.");
    return ctx.reply({ embeds: [embed] });
  }
};
