import { Guild, GuildMember, User } from "discord.js";

export interface ParserContext {
  user?: User | GuildMember;
  guild?: Guild;
  inviter?: User | GuildMember | string;
  inviteCount?: number;
  channelName?: string;
  roleName?: string;
  messageCount?: number;
}

/**
 * Replaces placeholders in template strings with actual context data.
 * Safe against missing/undefined values.
 */
export function parseVariables(template: string, ctx: ParserContext): string {
  if (!template) return "";

  const now = new Date();

  // Prepare standard values
  let userTag = "";
  let userName = "";
  let userMention = "";

  if (ctx.user) {
    if ("user" in ctx.user) {
      // GuildMember
      userTag = ctx.user.user.tag;
      userName = ctx.user.user.username;
      userMention = ctx.user.toString();
    } else {
      // User
      userTag = ctx.user.tag;
      userName = ctx.user.username;
      userMention = ctx.user.toString();
    }
  }

  const serverName = ctx.guild?.name ?? "";
  const memberCount = ctx.guild?.memberCount.toString() ?? "";
  const boosts = ctx.guild?.premiumSubscriptionCount?.toString() ?? "0";

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
    "{user}": userTag,
    "{username}": userName,
    "{mention}": userMention,
    "{server}": serverName,
    "{membercount}": memberCount,
    "{boosts}": boosts,
    "{inviter}": inviterName,
    "{invitecount}": ctx.inviteCount?.toString() ?? "0",
    "{channel}": ctx.channelName ? `#${ctx.channelName}` : "",
    "{role}": ctx.roleName ?? "",
    "{messages}": ctx.messageCount?.toString() ?? "0",
    "{date}": now.toLocaleDateString(),
    "{time}": now.toLocaleTimeString()
  };

  let parsed = template;
  for (const [placeholder, value] of Object.entries(replacers)) {
    parsed = parsed.split(placeholder).join(value);
  }

  return parsed;
}
