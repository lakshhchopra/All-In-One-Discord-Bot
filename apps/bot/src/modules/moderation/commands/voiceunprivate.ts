import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType, PermissionFlagsBits, VoiceChannel } from "discord.js";

export const voiceunprivateCommand: Command = {
  name: "voiceunprivate",
  aliases: ["voice unprivate"],
  description: "Make a voice channel public again (allow @everyone to connect).",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voiceunprivate [voice-channel-id]",
  examples: ["voiceunprivate", "voiceunprivate 123456789"],
  execute: async (ctx) => {
    const channelId = ctx.args[0];
    const vc = channelId
      ? ctx.guild.channels.cache.get(channelId)
      : ctx.member.voice.channel;

    if (!vc || vc.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid or no voice channel found. Provide a VC ID or join one.", ctx.guild)] }, 5);
    }

    await (vc as VoiceChannel).permissionOverwrites.edit(ctx.guild.roles.everyone, {
      Connect: null
    }, { reason: `VC made public by ${ctx.user.tag}` });

    return ctx.reply({ embeds: [UniversalEmbed.success(`🔓 **${vc.name}** is now **public** — @everyone can connect.`, ctx.guild)] });
  }
};
