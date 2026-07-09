import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType, VoiceChannel, GuildMember } from "discord.js";

export const voicemoveallCommand: Command = {
  name: "voicemoveall",
  aliases: ["voice moveall"],
  description: "Move all members from one voice channel to another.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "voicemoveall <from-vc-id> <to-vc-id>",
  examples: ["voicemoveall 111111111 222222222"],
  execute: async (ctx) => {
    const fromId = ctx.args[0];
    const toId = ctx.args[1];
    if (!fromId || !toId) return ctx.wrongUsage(voicemoveallCommand);

    const fromVC = ctx.guild.channels.cache.get(fromId);
    const toVC = ctx.guild.channels.cache.get(toId);

    if (!fromVC || fromVC.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid source voice channel ID.", ctx.guild)] }, 5);
    }
    if (!toVC || toVC.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid destination voice channel ID.", ctx.guild)] }, 5);
    }

    const members: GuildMember[] = [...(fromVC as any).members.values()];
    if (members.length === 0) return ctx.reply({ embeds: [UniversalEmbed.info("No members in the source voice channel.", ctx.guild)] }, 5);

    await ctx.reply({ embeds: [UniversalEmbed.info(`➡️ Moving **${members.length}** members to **${toVC.name}**...`, ctx.guild)] });
    let count = 0;
    for (const m of members) {
      try { await m.voice.setChannel(toVC as VoiceChannel); count++; } catch {}
    }
    return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Moved **${count}** members to **${toVC.name}**.`, ctx.guild)] });
  }
};
