import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../utils/duration.js";
import { isWhitelisted } from "../../../utils/security.js";

// Discord timeout max = 28 days
const MAX_TIMEOUT_MS = 28 * 24 * 60 * 60 * 1000;

export const muteCommand: Command = {
  name: "mute",
  description: "Timeout a member, preventing them from sending messages in any text channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "mute <member> <duration> [reason]",
  examples: [
    "mute @member 10m",
    "mute @member 1h Spamming",
    "mute 982232494223020042 30s",
    "mute @member 1d Breaking rules"
  ],
  execute: async (ctx) => {
    const whitelisted = await isWhitelisted(ctx.guild, ctx.user.id, "mute");
    if (!whitelisted) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not authorized by the owner to mute members.", ctx.guild)] }, 5);
    }

    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.wrongUsage(muteCommand);

    const durationStr = ctx.getStringOption("duration", 1);
    if (!durationStr) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must provide a duration. Examples: `10s`, `5m`, `1h`, `7d`.", ctx.guild)] }, 5);
    }

    const parsed = parseDuration(durationStr);
    if (!parsed) {
      return ctx.reply({ embeds: [UniversalEmbed.error(DURATION_FORMAT_ERROR, ctx.guild)] }, 5);
    }

    if (parsed.ms > MAX_TIMEOUT_MS) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Maximum timeout duration is **28 days**.", ctx.guild)] }, 5);
    }

    if (!member.moderatable) {
      return ctx.reply({ embeds: [UniversalEmbed.error("I cannot moderate this member. Check my role hierarchy.", ctx.guild)] }, 5);
    }

    if (member.roles.highest.position >= ctx.member.roles.highest.position) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You cannot mute someone with an equal or higher role.", ctx.guild)] }, 5);
    }

    // Collect remaining args as reason
    const reason = ctx.args.slice(2).join(" ") || "No reason provided";

    const until = new Date(Date.now() + parsed.ms);
    try {
      await member.disableCommunicationUntil(until, reason);
    } catch (err: any) {
      if (err.code === 50013) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Missing Permissions: Make sure my role is above the target in the hierarchy.", ctx.guild)] }, 5);
      }
      throw err;
    }

    return ctx.reply({
      embeds: [
        UniversalEmbed.success(
          `🔇 Muted **${member.user.tag}** for **${parsed.label}**\n**Reason:** ${reason}`,
          ctx.guild
        )
      ]
    });
  }
};
