import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const unmuteCommand: Command = {
  name: "unmute",
  description: "Remove a timeout from a member, restoring their ability to send messages.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "unmute <member>",
  examples: ["unmute @member", "unmute 982232494223020042"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Moderate Members`", ctx.guild)] }, 5);
    }

    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.wrongUsage(unmuteCommand);

    if (!member.isCommunicationDisabled()) {
      return ctx.reply({ embeds: [UniversalEmbed.warning(`**${member.user.tag}** is not currently muted.`, ctx.guild)] }, 5);
    }

    if (!member.moderatable) {
      return ctx.reply({ embeds: [UniversalEmbed.error("I cannot moderate this member. Check my role hierarchy.", ctx.guild)] }, 5);
    }

    try {
      await member.disableCommunicationUntil(null, "Unmuted by moderator");
    } catch (err: any) {
      if (err.code === 50013) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Missing Permissions: Make sure my role is above the target in the hierarchy.", ctx.guild)] }, 5);
      }
      throw err;
    }

    return ctx.reply({
      embeds: [UniversalEmbed.success(`🔊 Unmuted **${member.user.tag}** — they can now send messages again.`, ctx.guild)]
    });
  }
};
