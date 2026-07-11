import { Guild, GuildMember, User, Message } from "discord.js";

export interface ParserContext {
  user?: User | GuildMember;
  guild?: Guild;
  inviter?: User | GuildMember | string;
  inviteCount?: number;
  channelName?: string;
  channelId?: string;
  roleName?: string;
  messageCount?: number;
  prefix?: string;
  message?: Message;
}

function getOrdinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/**
 * Replaces placeholders in template strings with actual context data.
 * Safe against missing/undefined values.
 */
export function parseVariables(template: string, ctx: ParserContext): string {
  if (!template) return "";

  const now = new Date();

  // 1. User Context
  let userMention = "";
  let userTag = "";
  let userName = "";
  let userAvatar = "";
  let userDiscrim = "";
  let userId = "";
  let userNick = "";
  let userCreateDate = "";
  let userJoinDate = "";
  let userDisplayColor = "#ffffff";
  let userBoostSince = "Not boosting";

  if (ctx.user) {
    const isMember = "user" in ctx.user;
    const userObj = isMember ? (ctx.user as GuildMember).user : (ctx.user as User);
    const memberObj = isMember ? (ctx.user as GuildMember) : null;

    userMention = userObj.toString();
    userTag = userObj.tag;
    userName = userObj.username;
    userAvatar = userObj.displayAvatarURL({ extension: "png", size: 1024 });
    userDiscrim = userObj.discriminator;
    userId = userObj.id;
    userNick = memberObj?.displayName ?? userObj.username;
    userCreateDate = userObj.createdAt.toDateString();
    userJoinDate = memberObj?.joinedAt?.toDateString() ?? "";
    
    if (memberObj) {
      userDisplayColor = memberObj.displayHexColor;
      userBoostSince = memberObj.premiumSince ? memberObj.premiumSince.toDateString() : "Not boosting";
    }
  }

  // 2. Server Context
  const serverName = ctx.guild?.name ?? "";
  const serverId = ctx.guild?.id ?? "";
  const serverMemberCount = ctx.guild?.memberCount.toString() ?? "";
  const serverBotCount = ctx.guild?.members.cache.filter(m => m.user.bot).size.toString() ?? "0";
  const serverIcon = ctx.guild?.iconURL({ extension: "png", size: 1024 }) ?? "";
  const serverOwner = ctx.guild?.ownerId ? `<@${ctx.guild.ownerId}>` : "";
  const serverOwnerId = ctx.guild?.ownerId ?? "";
  const serverCreateDate = ctx.guild?.createdAt.toDateString() ?? "";
  const serverBoostLevel = ctx.guild?.premiumTier.toString() ?? "0";
  const serverBoostCount = ctx.guild?.premiumSubscriptionCount?.toString() ?? "0";
  const serverPrefix = ctx.prefix ?? "-";
  const serverCurrency = "$";

  // Additional Server variables
  const botCountNum = ctx.guild?.members.cache.filter(m => m.user.bot).size ?? 0;
  const memberCountNum = ctx.guild?.memberCount ?? 0;
  const noBotsNum = memberCountNum - botCountNum;
  
  const serverMemberCountNoBots = noBotsNum.toString();
  const serverMemberCountOrdinal = getOrdinal(memberCountNum);
  const serverMemberCountNoBotsOrdinal = getOrdinal(noBotsNum);
  const serverBotCountOrdinal = getOrdinal(botCountNum);
  const serverRoleCount = ctx.guild?.roles.cache.size.toString() ?? "0";
  const serverChannelCount = ctx.guild?.channels.cache.size.toString() ?? "0";
  
  const serverRandomMember = ctx.guild?.members.cache.random()?.toString() ?? "";
  const serverRandomMemberTag = ctx.guild?.members.cache.random()?.user.tag ?? "";
  const serverRandomMemberNoBots = ctx.guild?.members.cache.filter(m => !m.user.bot).random()?.toString() ?? "";

  const premiumSubscriptionCount = ctx.guild?.premiumSubscriptionCount ?? 0;
  let nextBoostLevel = "3";
  let nextBoostLevelRequired = "14";
  let nextBoostLevelUntilRequired = "0";
  
  if (premiumSubscriptionCount < 2) {
    nextBoostLevel = "1";
    nextBoostLevelRequired = "2";
    nextBoostLevelUntilRequired = (2 - premiumSubscriptionCount).toString();
  } else if (premiumSubscriptionCount < 7) {
    nextBoostLevel = "2";
    nextBoostLevelRequired = "7";
    nextBoostLevelUntilRequired = (7 - premiumSubscriptionCount).toString();
  } else if (premiumSubscriptionCount < 14) {
    nextBoostLevel = "3";
    nextBoostLevelRequired = "14";
    nextBoostLevelUntilRequired = (14 - premiumSubscriptionCount).toString();
  }

  // 3. Channel Context
  const channelMention = ctx.channelId ? `<#${ctx.channelId}>` : "";
  const channelName = ctx.channelName ?? "";
  const channelCreateDate = ctx.guild?.channels.cache.get(ctx.channelId ?? "")?.createdAt?.toDateString() ?? "";

  // 4. Message Context
  const messageLink = ctx.message?.url ?? "";
  const messageId = ctx.message?.id ?? "";
  const messageContent = ctx.message?.content ?? "";

  // 5. Inviter Context
  let inviterName = "";
  if (ctx.inviter) {
    if (typeof ctx.inviter === "string") {
      inviterName = ctx.inviter;
    } else if ("user" in ctx.inviter) {
      inviterName = ctx.inviter.user.username;
    } else {
      inviterName = ctx.inviter.username;
    }
  }

  const replacers: Record<string, string> = {
    // Deprecated back-compat tags
    "{mention}": userMention,
    "{username}": userName,
    "{server}": serverName,
    "{membercount}": serverMemberCount,
    "{boosts}": serverBoostCount,
    "{inviter}": inviterName,
    "{invitecount}": ctx.inviteCount?.toString() ?? "0",
    "{role}": ctx.roleName ?? "",
    "{messages}": ctx.messageCount?.toString() ?? "0",
    "{time}": now.toLocaleTimeString(),

    // User Information
    "{user}": userMention,
    "{user_tag}": userTag,
    "{user_name}": userName,
    "{user_avatar}": userAvatar,
    "{user_discrim}": userDiscrim,
    "{user_id}": userId,
    "{user_nick}": userNick,
    "{user_createdate}": userCreateDate,
    "{user_joindate}": userJoinDate,
    "{user_displaycolor}": userDisplayColor,
    "{user_boostsince}": userBoostSince,

    // Server Settings & Information
    "{server_prefix}": serverPrefix,
    "{server_currency}": serverCurrency,
    "{server_name}": serverName,
    "{server_id}": serverId,
    "{server_membercount}": serverMemberCount,
    "{server_membercount_nobots}": serverMemberCountNoBots,
    "{server_membercount_ordinal}": serverMemberCountOrdinal,
    "{server_membercount_nobots_ordinal}": serverMemberCountNoBotsOrdinal,
    "{server_botcount}": serverBotCount,
    "{server_botcount_ordinal}": serverBotCountOrdinal,
    "{server_icon}": serverIcon,
    "{server_rolecount}": serverRoleCount,
    "{server_channelcount}": serverChannelCount,
    "{server_randommember}": serverRandomMember,
    "{server_randommember_tag}": serverRandomMemberTag,
    "{server_randommember_nobots}": serverRandomMemberNoBots,
    "{server_owner}": serverOwner,
    "{server_owner_id}": serverOwnerId,
    "{server_createdate}": serverCreateDate,

    // Server Boost Information
    "{server_boostlevel}": serverBoostLevel,
    "{server_boostcount}": serverBoostCount,
    "{server_nextboostlevel}": nextBoostLevel,
    "{server_nextboostlevel_required}": nextBoostLevelRequired,
    "{server_nextboostlevel_until_required}": nextBoostLevelUntilRequired,

    // Channel Information
    "{channel}": channelMention,
    "{channel_name}": channelName,
    "{channel_createdate}": channelCreateDate,

    // Message Information
    "{message_link}": messageLink,
    "{message_id}": messageId,
    "{message_content}": messageContent,

    // Others
    "{date}": now.toDateString(),
    "{newline}": "\n"
  };

  let parsed = template;
  for (const [placeholder, value] of Object.entries(replacers)) {
    parsed = parsed.split(placeholder).join(value);
  }

  return parsed;
}

/**
 * Helper to validate if a string is a well-formed HTTP/S or attachment URL.
 */
export function isValidUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  return url.startsWith("http://") || url.startsWith("https://") || url.startsWith("attachment://");
}

/**
 * Recursively parses placeholders in string values of any object structure.
 * Automatically sanitizes invalid URL fields in embed structures.
 */
export function parseObjectVariables(obj: any, ctx: ParserContext): any {
  if (typeof obj === "string") {
    return parseVariables(obj, ctx);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => parseObjectVariables(item, ctx));
  }
  if (obj !== null && typeof obj === "object") {
    const newObj: any = {};
    for (const key in obj) {
      newObj[key] = parseObjectVariables(obj[key], ctx);
    }

    // Post-processing sanitization for embed fields
    if ("url" in newObj && typeof newObj.url === "string") {
      if (!isValidUrl(newObj.url)) {
        delete newObj.url;
      }
    }
    if ("author" in newObj && newObj.author && typeof newObj.author === "object") {
      if ("icon_url" in newObj.author && typeof newObj.author.icon_url === "string") {
        if (!isValidUrl(newObj.author.icon_url)) {
          delete newObj.author.icon_url;
        }
      }
    }
    if ("footer" in newObj && newObj.footer && typeof newObj.footer === "object") {
      if ("icon_url" in newObj.footer && typeof newObj.footer.icon_url === "string") {
        if (!isValidUrl(newObj.footer.icon_url)) {
          delete newObj.footer.icon_url;
        }
      }
    }
    if ("image" in newObj && newObj.image && typeof newObj.image === "object") {
      if ("url" in newObj.image && typeof newObj.image.url === "string") {
        if (!isValidUrl(newObj.image.url)) {
          delete newObj.image;
        }
      }
    }
    if ("thumbnail" in newObj && newObj.thumbnail && typeof newObj.thumbnail === "object") {
      if ("url" in newObj.thumbnail && typeof newObj.thumbnail.url === "string") {
        if (!isValidUrl(newObj.thumbnail.url)) {
          delete newObj.thumbnail;
        }
      }
    }

    return newObj;
  }
  return obj;
}
