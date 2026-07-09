import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { GuildMember } from "discord.js";

export const voicekickallCommand: Command = {
  name: "voicekickall",
  aliases: ["voice kickall"],
  description: "Disconnect all members from a voice channel (or all VCs).",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "voicekickall [voice-channel-id]",
  examples: ["voicekickall", "voicekickall 123456789"],
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

    await ctx.reply({ embeds: [UniversalEmbed.info(`🚪 Disconnecting **${targets.length}** voice members...`, ctx.guild)] });
    let count = 0;
    for (const m of targets) {
      try { await m.voice.disconnect(); count++; } catch {}
    }
    return ctx.reply({ embeds: [UniversalEmbed.success(`🚪 Disconnected **${count}** members from voice.`, ctx.guild)] });
  }
};
