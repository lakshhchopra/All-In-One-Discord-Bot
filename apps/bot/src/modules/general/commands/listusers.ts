import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listusersCommand: Command = {
  name: "listusers",
  aliases: ["list users"],
  description: "List members in the server.",
  category: "General Commands",
  usage: "listusers",
  examples: ["listusers"],
  execute: async (ctx: any) => {
    const members = [...ctx.guild.members.cache.values()].slice(0, 30);
    const description = members.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") +
      (ctx.guild.members.cache.size > 30 ? "\n... and more" : "");

    const embed = UniversalEmbed.neutral("Members List", ctx.guild)
      .setDescription(description)
      .setFooter({ text: `Total Members: ${ctx.guild.memberCount}` });

    return ctx.reply({ embeds: [embed] });
  }
};

