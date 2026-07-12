import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { ChannelType, VoiceChannel } from "discord.js";

export const voicepullCommand: Command = {
  name: "voicepull",
  aliases: ["voice pull"],
  description: "Pull a member into your current voice channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voicepull <@member>",
  examples: ["voicepull @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(voicepullCommand);

    if (!ctx.member.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in a voice channel to pull members.", ctx.guild)] }, 5);
    }
    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not in any voice channel.`, ctx.guild)] }, 5);
    }

    await target.voice.setChannel(ctx.member.voice.channel as VoiceChannel, `Pulled by ${ctx.user.tag}`);
    return ctx.reply({ embeds: [UniversalEmbed.success(`📥 Pulled **${target.user.tag}** into **${ctx.member.voice.channel.name}**.`, ctx.guild)] });
  }
};
