import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";
import { prisma } from "../../../services/db.js";

export const playCommand: Command = {
  name: "play",
  aliases: ["p"],
  description: "Play a song from YouTube, Spotify, or Soundcloud.",
  category: "Music",
    usage: "play <song name | url>",
  examples: ["play never gonna give you up", "play https://open.spotify.com/track/..."],
  execute: async (ctx: any) => {
    const query = ctx.args.join(" ");
    if (!query) return ctx.wrongUsage(playCommand);

    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in a voice channel to play music.", ctx.guild)] }, 5);
    }

    // Ensure bot has permission to join and speak
    const permissions = voiceChannel.permissionsFor(ctx.guild.members.me!);
    if (!permissions.has("Connect") || !permissions.has("Speak")) {
      return ctx.reply({ embeds: [UniversalEmbed.error("I don't have permission to join or speak in that voice channel.", ctx.guild)] }, 5);
    }

    const player = getPlayer();
    const musicConfig = await (prisma as any).musicConfig.findUnique({
      where: { guildId: ctx.guild.id }
    });
    
    const is247 = musicConfig?.twentyFourSeven ?? false;
    
    // Defer reply since searching can take a second
    const msg = await ctx.reply({ embeds: [UniversalEmbed.info(`🔍 Searching for **${query}**...`, ctx.guild)] });

    try {
      const { track } = await player.play((voiceChannel as any), query, {
        requestedBy: (ctx.user as any),
        nodeOptions: {
          metadata: ctx.channel,
          volume: 100,
          leaveOnEmpty: !is247,
          leaveOnEmptyCooldown: 300000,
          leaveOnEnd: !is247,
          leaveOnEndCooldown: 300000,
        },
      });

      return msg?.edit({
        embeds: [UniversalEmbed.success(`✅ Added **[${track.title}](${track.url})** to the queue.`, ctx.guild)]
      }).catch(() => null);

    } catch (e: any) {
      console.error(e);
      return msg?.edit({
        embeds: [UniversalEmbed.error(`Failed to play the track: ${e.message}`, ctx.guild)]
      }).catch(() => null);
    }
  }
};

