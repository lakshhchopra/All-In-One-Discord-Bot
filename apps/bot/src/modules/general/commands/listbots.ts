import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listbotsCommand: Command = {
  name: "listbots",
  aliases: ["list bots"],
  description: "List all bots in this server.",
  category: "General Commands",
  usage: "listbots",
  examples: ["listbots"],
  execute: async (ctx: any) => {
    const bots = ctx.guild.members.cache.filter((m: any) => m.user.bot);
    const description = bots.map((m: any) => `• **${m.user.tag}** (${m.id})`).slice(0, 30).join("\n") || "No bots in this server.";

    const embed = UniversalEmbed.neutral("Bots List", ctx.guild)
      .setDescription(description)
      .setFooter({ text: `Total Bots: ${bots.size}` });

    return ctx.reply({ embeds: [embed] });
  }
};

