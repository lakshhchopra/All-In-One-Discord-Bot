import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { ChannelType, VoiceChannel } from "discord.js";

export const voiceunlockCommand: Command = {
  name: "voiceunlock",
  aliases: ["voice unlock"],
  description: "Unlock a voice channel — restore normal connect permissions.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voiceunlock [voice-channel-id]",
  examples: ["voiceunlock", "voiceunlock 123456789"],
  execute: async (ctx) => {
    const channelId = ctx.args[0];
    const vc = channelId
      ? ctx.guild.channels.cache.get(channelId)
      : ctx.member.voice.channel;

    if (!vc || vc.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid or no voice channel. Provide a VC ID or join one.", ctx.guild)] }, 5);
    }

    await (vc as VoiceChannel).permissionOverwrites.edit(ctx.guild.roles.everyone, {
      Connect: null,
      Speak: null
    }, { reason: `VC unlocked by ${ctx.user.tag}` });

    return ctx.reply({ embeds: [UniversalEmbed.success(`🔓 **${vc.name}** has been **unlocked**.`, ctx.guild)] });
  }
};
