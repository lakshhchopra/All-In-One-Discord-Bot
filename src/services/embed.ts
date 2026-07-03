import { EmbedBuilder, Guild } from "discord.js";
import { getEmoji, EmojiName } from "../constants/emojis.js";

export type EmbedTheme = "success" | "warning" | "error" | "info" | "neutral";

export const THEME_COLORS: Record<EmbedTheme, number> = {
  success: 0x2ecc71, // Green
  warning: 0xf1c40f, // Gold/Yellow
  error: 0xe74c3c,   // Crimson Red
  info: 0x3498db,    // Blue
  neutral: 0x36393f  // Dark Grey
};

export const THEME_EMOJIS: Record<EmbedTheme, EmojiName> = {
  success: "success",
  warning: "warning",
  error: "error",
  info: "info",
  neutral: "member"
};

export class UniversalEmbed extends EmbedBuilder {
  constructor(theme: EmbedTheme, description?: string, guild?: Guild) {
    super();

    const color = THEME_COLORS[theme];
    this.setColor(color);

    if (description) {
      const emojiPrefix = getEmoji(THEME_EMOJIS[theme], guild?.id);
      this.setDescription(`${emojiPrefix} ${description}`);
    }

    this.setTimestamp();
  }

  static success(description: string, guild?: Guild): UniversalEmbed {
    return new UniversalEmbed("success", description, guild);
  }

  static warning(description: string, guild?: Guild): UniversalEmbed {
    return new UniversalEmbed("warning", description, guild);
  }

  static error(description: string, guild?: Guild): UniversalEmbed {
    return new UniversalEmbed("error", description, guild);
  }

  static info(description: string, guild?: Guild): UniversalEmbed {
    return new UniversalEmbed("info", description, guild);
  }

  static neutral(description: string, guild?: Guild): UniversalEmbed {
    return new UniversalEmbed("neutral", description, guild);
  }
}
