import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const unbanallCommand: Command = {
  name: "unbanall",
  description: "Unban all banned users from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "unbanall",
  examples: ["unbanall"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Ban Members`", ctx.guild)] }, 5);
    }

    try {
      const bans = await ctx.guild.bans.fetch();
      if (bans.size === 0) {
        return ctx.reply({ embeds: [UniversalEmbed.info("There are no banned users in this server.", ctx.guild)] });
      }

      let count = 0;
      for (const [_, banEntry] of bans) {
        await ctx.guild.members.unban(banEntry.user.id);
        count++;
      }

      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully unbanned all **${count}** user(s).`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to fetch/unban members. Make sure the bot has Ban Members permission.", ctx.guild)] }, 5);
    }
  }
};
