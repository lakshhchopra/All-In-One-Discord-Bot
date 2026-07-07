import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { TextChannel , PermissionFlagsBits } from "discord.js";

export const slowmodeCommand: Command = {
  name: "slowmode",
  description: "Configure slowmode duration for this channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "slowmode <seconds>",
  examples: ["slowmode 5", "slowmode 0"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Channels`", ctx.guild)] }, 5);
    }

    const seconds = ctx.getIntegerOption("seconds", 0);
    if (seconds === null) return ctx.wrongUsage(slowmodeCommand);

    const channel = ctx.channel as TextChannel;
    await channel.setRateLimitPerUser(seconds);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Slowmode has been set to **${seconds}** seconds.`, ctx.guild)] });
  }
};
