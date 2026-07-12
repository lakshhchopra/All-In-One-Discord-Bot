import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { GuildMember } from "discord.js";

export const voiceunmuteallCommand: Command = {
  name: "voiceunmuteall",
  aliases: ["voice unmuteall"],
  description: "Remove server-mute from all members in a voice channel (or all VCs).",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "voiceunmuteall [voice-channel-id]",
  examples: ["voiceunmuteall", "voiceunmuteall 123456789"],
  execute: async (ctx) => {
    const channelArg = ctx.args[0];
    let targets: GuildMember[] = [];

    if (channelArg) {
      const vc = ctx.guild.channels.cache.get(channelArg);
      if (!vc || !("members" in vc)) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Invalid voice channel ID.", ctx.guild)] }, 5);
      }
      targets = [...(vc as any).members.values()];
    } else {
      targets = [...ctx.guild.members.cache.values()].filter(m => m.voice.channel);
    }

    if (targets.length === 0) return ctx.reply({ embeds: [UniversalEmbed.info("No members are in voice channels.", ctx.guild)] }, 5);

    await ctx.reply({ embeds: [UniversalEmbed.info(`🔊 Unmuting **${targets.length}** members in voice...`, ctx.guild)] });
    let count = 0;
    for (const m of targets) {
      try { await m.voice.setMute(false); count++; } catch {}
    }
    return ctx.reply({ embeds: [UniversalEmbed.success(`🔊 Unmuted **${count}** voice members.`, ctx.guild)] });
  }
};
