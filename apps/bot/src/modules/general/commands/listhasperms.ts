import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { PermissionFlagsBits } from "discord.js";

export const listhaspermsCommand: Command = {
  name: "listhasperms",
  aliases: ["list hasperms"],
  description: "List all members holding a specific permission flag.",
  category: "General Commands",
  usage: "listhasperms <permission>",
  examples: ["listhasperms BanMembers"],
  execute: async (ctx: any) => {
    const permName = ctx.getStringOption("permission", 0);
    if (!permName || !(permName in PermissionFlagsBits)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid permission flag name (e.g. `BanMembers`, `KickMembers`).", ctx.guild)] }, 5);
    }

    const flag = (PermissionFlagsBits as any)[permName];
    const members = ctx.guild.members.cache.filter((m: any) => m.permissions.has(flag) && !m.user.bot);
    const description = members.map((m: any) => `• **${m.user.tag}**`).slice(0, 30).join("\n") || "No members have this permission.";

    const embed = UniversalEmbed.neutral(`Members with ${permName}`, ctx.guild)
      .setDescription(description)
      .setFooter({ text: `Showing up to 30 of ${members.size} member(s)` });

    return ctx.reply({ embeds: [embed] });
  }
};

