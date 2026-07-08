import { prisma } from "../db.js";

export interface ParsedResponse {
  content: string;
  embeds?: any[];
}

/**
 * Checks for the {embed:name} placeholder, removes it, and fetches/attaches the saved embed.
 */
export async function parseEmbedPlaceholder(text: string, guildId: string): Promise<ParsedResponse> {
  if (!text) return { content: "" };

  const embedRegex = /{embed:([a-zA-Z0-9_-]+)}/i;
  const match = text.match(embedRegex);

  if (!match) {
    return { content: text };
  }

  const embedName = match[1].toLowerCase();
  
  // Strip the placeholder from the message content
  const cleanedContent = text.replace(embedRegex, "").trim();

  try {
    const saved = await prisma.savedEmbed.findUnique({
      where: {
        guildId_name: {
          guildId,
          name: embedName
        }
      }
    });

    if (saved) {
      const embedData = saved.embedData as any;
      return {
        content: cleanedContent,
        embeds: [embedData]
      };
    }
  } catch (err) {
    console.error(`⚠️ Failed to parse embed placeholder {embed:${embedName}}:`, err);
  }

  // Fallback to sending the content without the embed if it is not found
  return { content: cleanedContent };
}
