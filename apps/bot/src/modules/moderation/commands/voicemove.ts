import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType, VoiceChannel } from "discord.js";

export const voicemoveCommand: Command = {
  name: "voicemove",
  aliases: ["voice move"],
  description: "Move a member from their current VC to another voice channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voicemove <@member> <voice-channel-id>",
  examples: ["voicemove @member 123456789"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    const channelId = ctx.args[1];
    if (!target || !channelId) return ctx.wrongUsage(voicemoveCommand);

    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not in a voice channel.`, ctx.guild)] }, 5);
    }

    const destVC = ctx.guild.channels.cache.get(channelId);
    if (!destVC || destVC.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid voice channel ID.", ctx.guild)] }, 5);
    }

    await target.voice.setChannel(destVC as VoiceChannel, `Moved by ${ctx.user.tag}`);
    return ctx.reply({ embeds: [UniversalEmbed.success(`➡️ Moved **${target.user.tag}** to **${destVC.name}**.`, ctx.guild)] });
  }
};
