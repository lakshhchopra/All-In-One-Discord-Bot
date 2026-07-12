import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { PermissionFlagsBits } from "discord.js";

export const listmodsCommand: Command = {
  name: "listmods",
  aliases: ["list mods", "listmoderators"],
  description: "List all moderators in the server.",
  category: "General Commands",
  usage: "listmods",
  examples: ["listmods"],
  execute: async (ctx: any) => {
    const mods = ctx.guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.ModerateMembers) && !m.user.bot);
    const description = mods.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No moderators found.";

    const embed = UniversalEmbed.neutral("Moderators List", ctx.guild)
      .setDescription(description);

    return ctx.reply({ embeds: [embed] });
  }
};

