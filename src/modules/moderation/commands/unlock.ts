import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { TextChannel , PermissionFlagsBits } from "discord.js";

export const unlockCommand: Command = {
  name: "unlock",
  description: "Unlock the current channel or specified channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "unlock [channel]",
  examples: ["unlock #general", "unlock"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Channels`", ctx.guild)] }, 5);
    }

    const channel = ctx.getChannelOption("channel", 0) as TextChannel || ctx.channel as TextChannel;
    await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: null });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Unlocked channel ${channel}`, ctx.guild)] }, 5);
  }
};
