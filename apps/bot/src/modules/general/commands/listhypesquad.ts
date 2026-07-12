import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listhypesquadCommand: Command = {
  name: "listhypesquad",
  aliases: ["list hypesquad"],
  description: "List all HypeSquad members in the server (placeholder/OAuth2 restricted).",
  category: "General Commands",
  usage: "listhypesquad",
  examples: ["listhypesquad"],
  execute: async (ctx: any) => {
    const embed = UniversalEmbed.neutral("HypeSquad Members", ctx.guild)
      .setDescription("This user list filter requires OAuth2 indexing which is currently not syncable.");
    return ctx.reply({ embeds: [embed] });
  }
};

