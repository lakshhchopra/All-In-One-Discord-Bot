import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listrolesCommand: Command = {
  name: "listroles",
  aliases: ["list roles"],
  description: "List all roles in this server.",
  category: "General Commands",
  usage: "listroles",
  examples: ["listroles"],
  execute: async (ctx: any) => {
    const roles = ctx.guild.roles.cache.map((r: any) => `• **${r.name}** (${r.id})`).slice(0, 30).join("\n") +
      (ctx.guild.roles.cache.size > 30 ? "\n... and more" : "");

    const embed = UniversalEmbed.neutral("Server Roles", ctx.guild)
      .setDescription(roles)
      .setFooter({ text: `Total Roles: ${ctx.guild.roles.cache.size}` });

    return ctx.reply({ embeds: [embed] });
  }
};

