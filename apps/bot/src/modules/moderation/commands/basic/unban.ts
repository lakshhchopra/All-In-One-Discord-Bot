import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const unbanCommand: Command = {
  name: "unban",
  description: "Unban a user from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "unban <user_id>",
  examples: ["unban 123456789012345678"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Ban Members`", ctx.guild)] }, 5);
    }

    const id = ctx.getStringOption("userId", 0);
    if (!id) return ctx.wrongUsage(unbanCommand);

    try {
      const user = await ctx.guild.members.unban(id);
      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully unbanned **${user?.tag ?? id}**`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to unban user. Check if ID is correct or user is not banned.", ctx.guild)] }, 5);
    }
  }
};
