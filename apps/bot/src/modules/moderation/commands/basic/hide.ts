import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { TextChannel , PermissionFlagsBits } from "discord.js";

export const hideCommand: Command = {
  name: "hide",
  description: "Hide the current channel or specified channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "hide [channel]",
  examples: ["hide #general", "hide"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Channels`", ctx.guild)] }, 5);
    }

    const channel = ctx.getChannelOption("channel", 0) as TextChannel || ctx.channel as TextChannel;
    await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: false });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully hid channel ${channel}`, ctx.guild)] }, 5);
  }
};
