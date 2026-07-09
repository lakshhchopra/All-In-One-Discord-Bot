import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType, VoiceChannel, GuildMember } from "discord.js";

export const voicepullallCommand: Command = {
  name: "voicepullall",
  aliases: ["voice pullall"],
  description: "Pull all members from a voice channel into your current voice channel.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "voicepullall <from-vc-id>",
  examples: ["voicepullall 123456789"],
  execute: async (ctx) => {
    if (!ctx.member.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in a voice channel to use this command.", ctx.guild)] }, 5);
    }

    const fromId = ctx.args[0];
    if (!fromId) return ctx.wrongUsage(voicepullallCommand);

    const fromVC = ctx.guild.channels.cache.get(fromId);
    if (!fromVC || fromVC.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid source voice channel ID.", ctx.guild)] }, 5);
    }

    const members: GuildMember[] = [...(fromVC as any).members.values()];
    if (members.length === 0) return ctx.reply({ embeds: [UniversalEmbed.info("No members in the source voice channel.", ctx.guild)] }, 5);

    await ctx.reply({ embeds: [UniversalEmbed.info(`📥 Pulling **${members.length}** members into **${ctx.member.voice.channel.name}**...`, ctx.guild)] });
    let count = 0;
    for (const m of members) {
      try { await m.voice.setChannel(ctx.member.voice.channel as VoiceChannel); count++; } catch {}
    }
    return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Pulled **${count}** members into your voice channel.`, ctx.guild)] });
  }
};
