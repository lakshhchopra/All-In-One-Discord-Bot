import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { TextChannel, PermissionFlagsBits } from "discord.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../utils/duration.js";

const MAX_SLOWMODE_S = 21600; // Discord max = 6 hours

export const slowmodeCommand: Command = {
  name: "slowmode",
  description: "Set slowmode on this channel. Use 0s to disable.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "slowmode <duration | 0>",
  examples: ["slowmode 5s", "slowmode 1m", "slowmode 2h", "slowmode 0"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Channels`", ctx.guild)] }, 5);
    }

    const raw = ctx.getStringOption("duration", 0);
    if (raw === null) return ctx.wrongUsage(slowmodeCommand);

    // Allow plain "0" to disable
    if (raw === "0" || raw === "0s") {
      const channel = ctx.channel as TextChannel;
      await channel.setRateLimitPerUser(0);
      return ctx.reply({ embeds: [UniversalEmbed.success("Slowmode has been **disabled**.", ctx.guild)] });
    }

    const parsed = parseDuration(raw);
    if (!parsed) {
      return ctx.reply({ embeds: [UniversalEmbed.error(DURATION_FORMAT_ERROR, ctx.guild)] }, 5);
    }

    if (parsed.seconds > MAX_SLOWMODE_S) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Maximum slowmode is **6 hours** (`6h`).", ctx.guild)] }, 5);
    }

    const channel = ctx.channel as TextChannel;
    await channel.setRateLimitPerUser(parsed.seconds);
    return ctx.reply({
      embeds: [UniversalEmbed.success(`Slowmode set to **${parsed.label}**.`, ctx.guild)]
    });
  }
};
