import { Guild, GuildMember, User } from "discord.js";

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

  // 3. Channel Context
  const channelMention = ctx.channelId ? `<#${ctx.channelId}>` : "";
  const channelName = ctx.channelName ?? "";

  // 4. Inviter Context
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

    // Server Settings & Information
    "{server_prefix}": serverPrefix,
    "{server_name}": serverName,
    "{server_id}": serverId,
    "{server_membercount}": serverMemberCount,
    "{server_botcount}": serverBotCount,
    "{server_icon}": serverIcon,
    "{server_owner}": serverOwner,
    "{server_owner_id}": serverOwnerId,
    "{server_createdate}": serverCreateDate,
    "{server_boostlevel}": serverBoostLevel,
    "{server_boostcount}": serverBoostCount,

    // Channel Information
    "{channel}": channelMention,
    "{channel_name}": channelName,

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
