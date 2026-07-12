import { Client, TextBasedChannel } from "discord.js";
import { Player, useMainPlayer } from "discord-player";
import { DefaultExtractors } from "@discord-player/extractor";
import { UniversalEmbed } from "./embed.js";
import { buildNowPlayingPayload } from "../modules/music/ui.js";
import { saveMusicState, clearMusicState, loadMusicState } from "./musicState.js";
import { prisma } from "./db.js";

let playerInstance: Player | null = null;

export async function setupMusicPlayer(client: Client) {
  if (playerInstance) return playerInstance;

  const player = new Player(client as any);
  playerInstance = player;

  // Load all default extractors (YouTube, Spotify, SoundCloud, Apple Music)
  await player.extractors.loadMulti(DefaultExtractors);

  // Events
  player.events.on("playerStart", (queue, track) => {
    const channel = queue.metadata as any;
    if (channel && channel.send) {
      const payload = buildNowPlayingPayload(queue, track);
      channel.send(payload).catch(() => null);
    }
    
    // Save state
    saveMusicState(queue).catch(console.error);
    
    // Update DB with active channels
    if (queue.channel && channel) {
      (prisma as any).musicConfig.updateMany({
        where: { guildId: queue.guild.id },
        data: { 
          lastVoiceChannelId: queue.channel.id,
          lastTextChannelId: channel.id
        }
      }).catch(console.error);
    }
  });

  player.events.on("audioTrackAdd", (queue) => {
    saveMusicState(queue).catch(console.error);
  });

  player.events.on("audioTracksAdd", (queue) => {
    saveMusicState(queue).catch(console.error);
  });

  player.events.on("emptyQueue", (queue) => {
    const channel = queue.metadata as any;
    if (channel && channel.send) {
      channel.send({ embeds: [new UniversalEmbed("info").setDescription("The queue has ended. I will leave the channel shortly unless 24/7 mode is enabled.")] }).catch(() => null);
    }
    clearMusicState(queue.guild.id).catch(console.error);
  });

  player.events.on("emptyChannel", (queue) => {
    const channel = queue.metadata as any;
    if (channel && channel.send) {
      channel.send({ embeds: [new UniversalEmbed("error").setDescription("Leaving the voice channel because it's empty and 24/7 mode is not enabled.")] }).catch(() => null);
    }
    clearMusicState(queue.guild.id).catch(console.error);
  });

  player.events.on("disconnect", (queue) => {
    // Only send if it naturally disconnected due to inactivity (not manually stopped)
    const channel = queue.metadata as any;
    if (channel && channel.send) {
      channel.send({ embeds: [new UniversalEmbed("error").setDescription("I have left the voice channel due to inactivity (24/7 mode is off).")] }).catch(() => null);
    }
    clearMusicState(queue.guild.id).catch(console.error);
  });

  player.events.on("error", (queue, error) => {
    console.error(`[Music Error] ${error.message}`);
    const channel = queue.metadata as any;
    if (channel && channel.send) {
      channel.send({ embeds: [new UniversalEmbed("error").setDescription("An error occurred while playing music.")] }).catch(() => null);
    }
  });

  player.events.on("playerError", (queue, error) => {
    console.error(`[Player Error] ${error.message}`);
  });

  return player;
}

export function getPlayer(): Player {
  const p = useMainPlayer();
  if (!p) throw new Error("Player is not initialized");
  return p;
}

export async function resume247Sessions(client: Client) {
  const player = getPlayer();
  const configs = await (prisma as any).musicConfig.findMany({
    where: { 
      twentyFourSeven: true,
      lastVoiceChannelId: { not: null }
    }
  });

  for (const config of configs) {
    try {
      const guild = client.guilds.cache.get(config.guildId);
      if (!guild) continue;
      
      const vc = guild.channels.cache.get(config.lastVoiceChannelId!) as any;
      if (!vc) continue;

      const state = await loadMusicState(config.guildId);
      
      // If we have a state with tracks, restore them
      if (state && (state.currentTrack || state.tracks.length > 0)) {
        const textChannel = config.lastTextChannelId ? guild.channels.cache.get(config.lastTextChannelId) as any : undefined;
        
        let firstTrack = state.currentTrack || state.tracks[0];
        let remainingTracks = state.currentTrack ? state.tracks : state.tracks.slice(1);
        
        const searchResult = await player.search(firstTrack, { requestedBy: client.user! as any });
        if (searchResult.hasTracks()) {
          const { queue } = await player.play(vc, searchResult, {
            nodeOptions: {
              metadata: textChannel,
              leaveOnEmpty: false,
              leaveOnEnd: false,
              leaveOnStop: false,
              volume: config.volume,
              repeatMode: state.repeatMode as any
            }
          });
          
          // Add remaining tracks to queue
          for (const trackUrl of remainingTracks) {
            const result = await player.search(trackUrl, { requestedBy: client.user! as any });
            if (result.hasTracks()) {
              queue.addTrack(result.tracks[0]);
            }
          }
        }
      } else {
        // Just join the voice channel silently
        let queue = player.nodes.get(config.guildId);
        if (!queue) {
          queue = player.nodes.create(guild as any, {
            leaveOnEmpty: false,
            leaveOnEnd: false,
            leaveOnStop: false,
            volume: config.volume,
          });
        }
        if (!queue.connection) await queue.connect(vc as any);
      }
    } catch (err) {
      console.error(`[Music] Failed to resume 24/7 session for guild ${config.guildId}:`, err);
    }
  }
}

