import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const voiceunmuteCommand: Command = {
  name: "voiceunmute",
  aliases: ["voice unmute"],
  description: "Remove server-mute from a member in their voice channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voiceunmute <@member>",
  examples: ["voiceunmute @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(voiceunmuteCommand);
    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not in a voice channel.`, ctx.guild)] }, 5);
    }
    await target.voice.setMute(false, `Voice unmuted by ${ctx.user.tag}`);
    return ctx.reply({ embeds: [UniversalEmbed.success(`🔊 Voice unmuted **${target.user.tag}**.`, ctx.guild)] });
  }
};
