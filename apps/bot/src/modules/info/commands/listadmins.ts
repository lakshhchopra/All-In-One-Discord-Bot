import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { PermissionFlagsBits } from "discord.js";

export const listadminsCommand: Command = {
  name: "listadmins",
  aliases: ["list admins", "listadministrators"],
  description: "List all administrators in the server.",
  category: "General Commands",
  usage: "listadmins",
  examples: ["listadmins"],
  execute: async (ctx) => {
    const admins = ctx.guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot);
    const description = admins.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No administrators found.";

    const embed = UniversalEmbed.neutral("Administrators List", ctx.guild)
      .setDescription(description);

    return ctx.reply({ embeds: [embed] });
  }
};
