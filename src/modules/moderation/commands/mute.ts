import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const muteCommand: Command = {
  name: "mute",
  description: "Mute a member in server voice channels.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "mute <member>",
  examples: ["mute @member"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Mute Members`", ctx.guild)] }, 5);
    }

    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.wrongUsage(muteCommand);

    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setMute(true);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Voice muted **${member.user.tag}**`, ctx.guild)] });
  }
};
