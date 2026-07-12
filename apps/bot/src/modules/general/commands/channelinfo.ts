import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType } from "discord.js";

export const channelinfoCommand: Command = {
  name: "channelinfo",
  description: "Get detailed information about a text or voice channel.",
  category: "General Commands",
  usage: "channelinfo [channel]",
  examples: ["channelinfo", "channelinfo #general"],
  execute: async (ctx: any) => {
    const chOption = ctx.getChannelOption("channel", 0) || ctx.channel;
    const channel = ctx.guild.channels.cache.get((chOption as any).id);

    if (!channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Channel not found.", ctx.guild)] }, 5);
    }

    const typeString = ChannelType[channel.type] || "Unknown";
    const timestamp = Math.floor((channel.createdTimestamp ?? 0) / 1000);

    const embed = UniversalEmbed.neutral(`Channel Info: ${channel.name}`, ctx.guild)
      .addFields(
        { name: "Channel Name", value: channel.name, inline: true },
        { name: "Channel ID", value: `\`${channel.id}\``, inline: true },
        { name: "Channel Type", value: typeString, inline: true },
        { name: "Created At", value: `<t:${timestamp}:F> (<t:${timestamp}:R>)`, inline: false }
      );

    if ("parent" in channel && channel.parent) {
      embed.addFields({ name: "Category Name", value: channel.parent.name, inline: true });
    }

    if ("topic" in channel && channel.topic) {
      embed.addFields({ name: "Topic", value: channel.topic || "None", inline: false });
    }

    return ctx.reply({ embeds: [embed] });
  }
};

