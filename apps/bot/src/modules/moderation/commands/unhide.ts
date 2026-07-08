import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { TextChannel , PermissionFlagsBits } from "discord.js";

export const unhideCommand: Command = {
  name: "unhide",
  description: "Unhide the current channel or specified channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "unhide [channel]",
  examples: ["unhide #general", "unhide"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Channels`", ctx.guild)] }, 5);
    }

    const channel = ctx.getChannelOption("channel", 0) as TextChannel || ctx.channel as TextChannel;
    await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: null });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully unhid channel ${channel}`, ctx.guild)] }, 5);
  }
};
