export const EMOJIS = {
  module: "<:gp_module:1524148782432780379>",
  bottle: "<:gp_bottle:1524148723310002286>",
  info: "<:gp_info:1524146747071397928>",
  welcomer: "<:gp_welcome:1524140440708714616>",
  settings: "<:gp_settings:1524140469578105024>",
  media: "<:gp_media:1524140339223330846>",
  moderation: "<:gp_mod:1524140369938354308>",
  giveaway: "<:gp_giveaway:1524143169694859436>",
  antinuke: "<:gp_shield:1524143216222535891>",
  voicemaster: "<:gp_sound:1524143298745340027>",
  voice: "<:gp_voice:1524143263374639336>",
  home: "<:gp_home:1524136989660811557>",
  dustbin: "<:gp_dustbin:1524140290343174175>",
  pad: "<:gp_pad:1524140410048483469>",
  success: "<:gp_success:1524159439257473105>",
  error: "❌",
  warning: "⚠️",
};

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
