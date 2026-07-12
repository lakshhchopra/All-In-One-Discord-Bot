import { Client } from "discord.js";

export const EMOJIS = {
  module: "<:gp_module:1524354240817135616>",
  bottle: "<:gp_bottle:1524354224664875111>",
  info: "<:gp_info:1524354233225318431>",
  welcomer: "<:gp_welcome:1524354256595976202>",
  settings: "<:gp_settings:1524354245732597882>",
  media: "<:gp_media:1524354235666399345>",
  moderation: "<:gp_mod:1524354238254415986>",
  giveaway: "<:gp_giveaway:1524354228850786498>",
  gwy: "<:gp_gwy:1524366800702148698>",
  antinuke: "<:gp_shield:1524354247704051753>",
  voicemaster: "<:gp_sound:1524354249956528260>",
  voice: "<:gp_voice:1524354254519926824>",
  home: "<:gp_home:1524354231471968308>",
  dustbin: "<:gp_dustbin:1524354226430673120>",
  pad: "<:gp_pad:1524354243878846545>",
  success: "<:gp_success:1524354252342824960>",
  error: "❌",
  warning: "⚠️",
  tempvc_rename: "<:gp_tempvc_rename:1524439672867258711>",
  tempvc_limit: "<:gp_tempvc_limit:1524439664876978207>",
  tempvc_region: "<:gp_tempvc_region:1524439669847232602>",
  tempvc_kick: "<:gp_tempvc_kick:1524439662599606382>",
  tempvc_lock: "<:gp_tempvc_lock:1524439667209011290>",
  tempvc_unlock: "<:gp_tempvc_unlock:1524439683453550612>",
  tempvc_hide: "<:gp_tempvc_hide:1524439660246466661>",
  tempvc_unhide: "<:gp_tempvc_unhide:1524439681092026418>",
  tempvc_transfer: "<:gp_tempvc_transfer:1524439675614265416>",
  tempvc_claim: "<:gp_tempvc_claim:1524439657918628040>",
  tempvc_trust: "<:gp_tempvc_trust:1524439678302949387>",
  tempvc_untrust: "<:gp_tempvc_untrust:1524439686246830151>",
};

const EMOJI_MAPPING: Record<string, string> = {
  gp_module: "module",
  gp_bottle: "bottle",
  gp_info: "info",
  gp_welcome: "welcomer",
  gp_settings: "settings",
  gp_media: "media",
  gp_mod: "moderation",
  gp_giveaway: "giveaway",
  gp_gwy: "gwy",
  gp_shield: "antinuke",
  gp_sound: "voicemaster",
  gp_voice: "voice",
  gp_home: "home",
  gp_dustbin: "dustbin",
  gp_pad: "pad",
  gp_success: "success",
  gp_tempvc_rename: "tempvc_rename",
  gp_tempvc_limit: "tempvc_limit",
  gp_tempvc_region: "tempvc_region",
  gp_tempvc_kick: "tempvc_kick",
  gp_tempvc_lock: "tempvc_lock",
  gp_tempvc_unlock: "tempvc_unlock",
  gp_tempvc_hide: "tempvc_hide",
  gp_tempvc_unhide: "tempvc_unhide",
  gp_tempvc_transfer: "tempvc_transfer",
  gp_tempvc_claim: "tempvc_claim",
  gp_tempvc_trust: "tempvc_trust",
  gp_tempvc_untrust: "tempvc_untrust",
};

/**
 * Dynamically fetches the application emojis and updates the EMOJIS object keys.
 */
export async function loadApplicationEmojis(client: Client) {
  try {
    let appCount = 0;
    let guildCount = 0;

    // 1. Load Application Emojis from Developer Portal
    if (client.application) {
      console.log("🔄 Fetching application emojis from Developer Portal...");
      const appEmojis = await client.application.emojis.fetch().catch(() => null);
      if (appEmojis) {
        for (const [id, emoji] of appEmojis) {
          if (!emoji.name) continue;
          const key = EMOJI_MAPPING[emoji.name] || emoji.name;
          if (key in EMOJIS) {
            (EMOJIS as any)[key] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${id}>`;
            appCount++;
          }
        }
      }
    }

    // 2. Load Guild Emojis from client cache (resolves prefix message rendering issues!)
    const guildEmojis = client.emojis.cache;
    if (guildEmojis && guildEmojis.size > 0) {
      for (const [id, emoji] of guildEmojis) {
        if (!emoji.name) continue;
        const key = EMOJI_MAPPING[emoji.name] || emoji.name;
        if (key in EMOJIS) {
          (EMOJIS as any)[key] = `<${emoji.animated ? "a" : ""}:${emoji.name}:${id}>`;
          guildCount++;
        }
      }
    }

    console.log(`✅ Loaded ${appCount} application emojis and ${guildCount} guild emojis dynamically.`);
  } catch (error) {
    console.error("⚠️ Failed to load emojis dynamically:", error);
  }
}

/**
 * Parses an emoji string into a format compatible with Discord.js components.
 * Supports Unicode strings and raw custom emoji formats (<:name:id> or <a:name:id>).
 */
export function parseEmoji(emojiStr: string) {
  if (emojiStr.startsWith("<") && emojiStr.endsWith(">")) {
    const parts = emojiStr.slice(1, -1).split(":");
    return {
      name: parts[1],
      id: parts[2],
      animated: emojiStr.startsWith("<a:")
    };
  }
  return emojiStr; // Unicode emoji string
}

/**
 * Converts a raw Discord custom/animated emoji string into its public CDN image URL.
 * Used for contexts that only accept image URLs (like embed footers).
 */
export function getEmojiUrl(emojiStr: string): string | undefined {
  if (emojiStr && emojiStr.startsWith("<") && emojiStr.endsWith(">")) {
    const parts = emojiStr.slice(1, -1).split(":");
    const id = parts[2];
    const isAnimated = emojiStr.startsWith("<a:");
    return `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? "gif" : "png"}`;
  }
  return undefined;
}

