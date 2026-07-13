import { Message, Guild, GuildMember, User } from "discord.js";
import { prisma } from "../db.js";
import { parseObjectVariables, ParserContext } from "./parser.js";

export interface ParsedResponse {
  content: string;
  embeds?: any[];
}

export interface FinalPayload {
  content: string;
  embeds?: any[];
  isDm?: boolean;
  targetChannelId?: string;
  isSilent?: boolean;
  shouldDeleteTrigger?: boolean;
  deleteReplyAfter?: number; // seconds
}

/**
 * Checks for the {embed:name} placeholder, removes it, and fetches/attaches the saved embed.
 */
export async function parseEmbedPlaceholder(text: string, guildId: string, ctx?: ParserContext): Promise<ParsedResponse> {
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
      let embedData = saved.embedData as any;
      if (ctx) {
        embedData = parseObjectVariables(embedData, ctx);
      }
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

/**
 * Parses dynamic functions (like {dm}, {silent:}, {delete}, {sendto:id}, {delete_reply:seconds})
 * and resolves any embedded placeholders.
 */
export async function parseFunctions(text: string, guildId: string, ctx?: ParserContext): Promise<FinalPayload> {
  let content = text;
  let isDm = false;
  let targetChannelId: string | undefined = undefined;
  let isSilent = false;
  let shouldDeleteTrigger = false;
  let deleteReplyAfter: number | undefined = undefined;

  // 1. Check {dm}
  if (/{dm}/i.test(content)) {
    isDm = true;
    content = content.replace(/{dm}/gi, "");
  }

  // 2. Check {silent:}
  if (/{silent:}/i.test(content)) {
    isSilent = true;
    content = content.replace(/{silent:}/gi, "");
  }

  // 3. Check {delete}
  if (/{delete}/i.test(content)) {
    shouldDeleteTrigger = true;
    content = content.replace(/{delete}/gi, "");
  }

  // 4. Check {sendto:channel_id}
  const sendToMatch = content.match(/{sendto:(\d+)}/i);
  if (sendToMatch) {
    targetChannelId = sendToMatch[1];
    content = content.replace(/{sendto:\d+}/gi, "");
  }

  // 5. Check {delete_reply:seconds}
  const deleteReplyMatch = content.match(/{delete_reply:(\d+)[s]?}/i);
  if (deleteReplyMatch) {
    deleteReplyAfter = parseInt(deleteReplyMatch[1], 10);
    content = content.replace(/{delete_reply:\d+[s]?}/gi, "");
  }

  // 6. Check for {embed:name}
  const embedRes = await parseEmbedPlaceholder(content, guildId, ctx);
  
  return {
    content: embedRes.content.trim(),
    embeds: embedRes.embeds,
    isDm,
    targetChannelId,
    isSilent,
    shouldDeleteTrigger,
    deleteReplyAfter
  };
}

/**
 * Handles sending the final payload to the appropriate target and executing deletions/actions.
 */
export async function executeSend(
  defaultChannel: any,
  payload: FinalPayload,
  ctxUser: any,
  guild: Guild,
  triggerMessage?: Message
) {
  let target = defaultChannel;

  // 1. Handle trigger deletion immediately if requested
  if (payload.shouldDeleteTrigger && triggerMessage && triggerMessage.deletable) {
    await triggerMessage.delete().catch(() => null);
  }

  // 2. Handle {dm} redirection
  if (payload.isDm) {
    const userObj = "user" in ctxUser ? ctxUser.user : ctxUser;
    target = await userObj.createDM().catch(() => null);
    if (!target) {
      console.warn(`⚠️ Cannot send DM to user ${userObj.id}, DMs might be closed.`);
      return null;
    }
  } 
  // 3. Handle {sendto:channel_id} redirection
  else if (payload.targetChannelId) {
    const ch = guild.channels.cache.get(payload.targetChannelId);
    if (ch && "send" in ch) {
      target = ch;
    } else {
      console.warn(`⚠️ Target channel ${payload.targetChannelId} not found or not sendable in guild ${guild.id}.`);
    }
  }

  if (!target || !("send" in target)) {
    return null;
  }

  // 4. Construct send options
  const sendOptions: any = {
    content: payload.content || undefined,
    embeds: payload.embeds
  };

  if (payload.isSilent) {
    sendOptions.flags = 4096; // SuppressNotifications flag (MessageFlags.SuppressNotifications)
  }

  // 5. Send message
  const sentMessage = await target.send(sendOptions).catch((err: any) => {
    console.error(`⚠️ Failed to send parsed response:`, err);
    return null;
  });

  // 6. Handle {delete_reply:N}
  if (sentMessage && payload.deleteReplyAfter !== undefined && payload.deleteReplyAfter > 0) {
    setTimeout(() => {
      sentMessage.delete().catch(() => null);
    }, payload.deleteReplyAfter * 1000);
  }

  return sentMessage;
}
