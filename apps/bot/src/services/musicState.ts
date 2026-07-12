import { redis } from "./redis.js";
import { GuildQueue } from "discord-player";

export interface SerializedQueue {
  guildId: string;
  currentTrack: string | null;
  tracks: string[];
  repeatMode: number;
}

/**
 * Saves the current queue state to Redis.
 */
export async function saveMusicState(queue: GuildQueue): Promise<void> {
  const guildId = queue.guild.id;
  const currentTrack = queue.currentTrack?.url || null;
  const tracks = queue.tracks.toArray().map(t => t.url);

  const state: SerializedQueue = {
    guildId,
    currentTrack,
    tracks,
    repeatMode: queue.repeatMode
  };

  // Save with a 24 hour expiry just in case
  await redis.set(`music:state:${guildId}`, JSON.stringify(state), "EX", 86400);
}

/**
 * Loads the saved queue state from Redis.
 */
export async function loadMusicState(guildId: string): Promise<SerializedQueue | null> {
  const data = await redis.get(`music:state:${guildId}`);
  if (!data) return null;
  
  try {
    return JSON.parse(data) as SerializedQueue;
  } catch {
    return null;
  }
}

/**
 * Clears the saved queue state from Redis.
 */
export async function clearMusicState(guildId: string): Promise<void> {
  await redis.del(`music:state:${guildId}`);
}
