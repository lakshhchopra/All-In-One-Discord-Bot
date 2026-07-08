import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listCommand: Command = {
  name: "list",
  description: "List roles or bots in this server.",
  category: "Extras",
  usage: "list <roles | bots>",
  examples: [
    "list roles",
    "list bots"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("type", 0)?.toLowerCase();

    if (action === "roles") {
      const roles = ctx.guild.roles.cache.map(r => `• ${r.name} (${r.id})`).slice(0, 30).join("\n") + (ctx.guild.roles.cache.size > 30 ? "\n... and more" : "");
      const embed = UniversalEmbed.info("Server Roles List", ctx.guild)
        .setDescription(roles);
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "bots") {
      const bots = ctx.guild.members.cache.filter(m => m.user.bot).map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No bots in this server.";
      const embed = UniversalEmbed.info("Server Bots List", ctx.guild)
        .setDescription(bots);
      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `list [roles|bots]`", ctx.guild)] });
  }
};
