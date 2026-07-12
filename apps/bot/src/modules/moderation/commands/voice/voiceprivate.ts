import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { ChannelType, PermissionFlagsBits, VoiceChannel } from "discord.js";

export const voiceprivateCommand: Command = {
  name: "voiceprivate",
  aliases: ["voice private"],
  description: "Make a voice channel private (deny @everyone from connecting).",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voiceprivate [voice-channel-id]",
  examples: ["voiceprivate", "voiceprivate 123456789"],
  execute: async (ctx) => {
    const channelId = ctx.args[0];
    const vc = channelId
      ? ctx.guild.channels.cache.get(channelId)
      : ctx.member.voice.channel;

    if (!vc || vc.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid or no voice channel found. Provide a voice channel ID or join one.", ctx.guild)] }, 5);
    }

    await (vc as VoiceChannel).permissionOverwrites.edit(ctx.guild.roles.everyone, {
      Connect: false
    }, { reason: `VC made private by ${ctx.user.tag}` });

    return ctx.reply({ embeds: [UniversalEmbed.success(`🔒 **${vc.name}** is now **private** — @everyone cannot connect.`, ctx.guild)] });
  }
};
