import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const voicemuteCommand: Command = {
  name: "voicemute",
  aliases: ["voice mute"],
  description: "Server-mute a member in their voice channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voicemute <@member>",
  examples: ["voicemute @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(voicemuteCommand);
    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not in a voice channel.`, ctx.guild)] }, 5);
    }
    await target.voice.setMute(true, `Voice muted by ${ctx.user.tag}`);
    return ctx.reply({ embeds: [UniversalEmbed.success(`🔇 Voice muted **${target.user.tag}**.`, ctx.guild)] });
  }
};
