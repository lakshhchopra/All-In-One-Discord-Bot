import { prisma } from "./db.js";
import { getCache, setCache, deleteCache } from "./redis.js";

const CACHE_TTL = 300; // 5 minutes in seconds

export class CacheService {
  /**
   * Retrieves the GuildConfig from cache, or database if missing.
   */
  static async getGuildConfig(guildId: string) {
    const key = `guildConfig:${guildId}`;
    const cached = await getCache<any>(key);
    
    if (cached) {
      return cached;
    }

    const config = await prisma.guildConfig.findUnique({ where: { guildId } });
    if (config) {
      await setCache(key, config, CACHE_TTL);
    }
    return config;
  }

  /**
   * Clears the GuildConfig cache
   */
  static async clearGuildConfig(guildId: string) {
    await deleteCache(`guildConfig:${guildId}`);
  }

  /**
   * Retrieves the ExtraOwner status from cache, or database if missing.
   */
  static async getExtraOwner(guildId: string, userId: string) {
    const key = `extraOwner:${guildId}:${userId}`;
    const cached = await getCache<boolean>(key);
    
    if (cached !== null) {
      return cached;
    }

    const extraOwner = await prisma.extraOwner.findUnique({
      where: {
        guildId_userId: { guildId, userId }
      }
    });

    const isExtraOwner = !!extraOwner;
    await setCache(key, isExtraOwner, CACHE_TTL);
    
    return isExtraOwner;
  }

  /**
   * Clears the ExtraOwner cache
   */
  static async clearExtraOwner(guildId: string, userId: string) {
    await deleteCache(`extraOwner:${guildId}:${userId}`);
  }

  /**
   * Retrieves whitelist (no-prefix) status from cache
   */
  static async getNoPrefix(guildId: string, userId: string) {
    const key = `noPrefix:${guildId}:${userId}`;
    const cached = await getCache<boolean>(key);
    
    if (cached !== null) {
      return cached;
    }

    const whitelist = await prisma.whitelist.findUnique({
      where: { guildId_targetId: { guildId, targetId: userId } }
    });

    const isNoPrefix = whitelist?.type === "noprefix";
    await setCache(key, isNoPrefix, CACHE_TTL);

    return isNoPrefix;
  }

  /**
   * Clears the whitelist cache
   */
  static async clearNoPrefix(guildId: string, userId: string) {
    await deleteCache(`noPrefix:${guildId}:${userId}`);
  }
}
