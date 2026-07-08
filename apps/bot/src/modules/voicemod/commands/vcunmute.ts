import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const vcunmuteCommand: Command = {
  name: "vcunmute",
  description: "Unmutes a user in a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  usage: "vcunmute <member>",
  examples: ["vcunmute @member"],
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setMute(false);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Voice unmuted **${member.user.tag}**`, ctx.guild)] });
  }
};
