import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";
import { prisma } from "../../../services/db.js";

export const joinCommand: Command = {
  name: "join",
  aliases: ["j", "summon"],
  description: "Summon the bot to your current voice channel.",
  category: "Music",
  usage: "join",
  execute: async (ctx: any) => {
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in a voice channel to summon me.", ctx.guild)] }, 5);
    }

    const permissions = voiceChannel.permissionsFor(ctx.guild.members.me!);
    if (!permissions.has("Connect") || !permissions.has("Speak")) {
      return ctx.reply({ embeds: [UniversalEmbed.error("I don't have permission to join or speak in that voice channel.", ctx.guild)] }, 5);
    }

    const player = getPlayer();
    const musicConfig = await (prisma as any).musicConfig.findUnique({
      where: { guildId: ctx.guild.id }
    });
    
    const is247 = musicConfig?.twentyFourSeven ?? false;
    
    let queue = player.nodes.get(ctx.guild.id);
    if (!queue) {
      queue = player.nodes.create((ctx.guild as any), {
        metadata: ctx.channel,
        volume: 100,
        leaveOnEmpty: !is247,
        leaveOnEmptyCooldown: 300000,
        leaveOnEnd: !is247,
        leaveOnEndCooldown: 300000,
      });
    }

    if (!queue.connection) {
      await queue.connect((voiceChannel as any));
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Successfully joined **${voiceChannel.toString()}**.`, ctx.guild)] });
    } else if (queue.channel?.id !== voiceChannel.id) {
      // If already playing somewhere else, maybe just reject? Or move?
      return ctx.reply({ embeds: [UniversalEmbed.error(`I'm already playing in ${queue.channel?.toString()}.`, ctx.guild)] }, 5);
    } else {
      return ctx.reply({ embeds: [UniversalEmbed.info("I am already in your voice channel.", ctx.guild)] });
    }
  }
};

