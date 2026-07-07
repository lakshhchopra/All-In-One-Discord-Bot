import { EmbedBuilder, Guild } from "discord.js";
import { EMOJIS } from "../config/emojis.js";

export type EmbedTheme = "success" | "warning" | "error" | "info" | "neutral";

export const THEME_COLORS: Record<EmbedTheme, number> = {
  success: 0x00FF87, // Neon Green
  warning: 0xf1c40f, // Gold/Yellow
  error: 0xFF0055,   // Neon Red
  info: 0x3498db,    // Blue
  neutral: 0x36393f  // Dark Grey
};

export class UniversalEmbed extends EmbedBuilder {
  constructor(theme: EmbedTheme, description?: string, guild?: Guild) {
    super();

    const color = THEME_COLORS[theme];
    this.setColor(color);

    if (description) {
      let emojiKey: keyof typeof EMOJIS;
      if (theme === "neutral") {
        emojiKey = "info";
      } else {
        emojiKey = theme as keyof typeof EMOJIS;
      }

      const emojiPrefix = EMOJIS[emojiKey] || "";
      this.setDescription(`${emojiPrefix} ${description}`);
    }
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
