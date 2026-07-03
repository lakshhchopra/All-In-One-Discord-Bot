// Default Emoji Mappings (Unicode/Standard)
export const DEFAULT_EMOJIS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  member: "👤",
  owner: "👑",
  lock: "🔒",
  unlock: "🔓",
  voice: "🎙️",
  channel: "📁",
  boost: "⚡",
  moderation: "🛡️",
  logging: "📜",
  security: "🔐",
  giveaway: "🎁",
  invite: "📨",
  message: "💬",
  game: "🎮",
  info: "ℹ️"
};

export type EmojiName = keyof typeof DEFAULT_EMOJIS;

// We can extend this with dynamic lookups if the server customizes emojis from the dashboard
const emojiOverrides: Record<string, Record<string, string>> = {};

export function getEmoji(name: EmojiName, guildId?: string): string {
  if (guildId && emojiOverrides[guildId]?.[name]) {
    return emojiOverrides[guildId][name];
  }
  return DEFAULT_EMOJIS[name];
}

export function setEmojiOverride(guildId: string, name: EmojiName, value: string) {
  if (!emojiOverrides[guildId]) {
    emojiOverrides[guildId] = {};
  }
  emojiOverrides[guildId][name] = value;
}
