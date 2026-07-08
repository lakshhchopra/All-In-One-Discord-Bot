import { Command } from "../../../commands/command.js";
import { VoiceChannel } from "discord.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const vclistCommand: Command = {
  name: "vclist",
  description: "List all users in your voice channel or a specified channel.",
  category: "Voice Moderation",
  usage: "vclist [channel]",
  examples: ["vclist", "vclist #General-Voice"],
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0) as VoiceChannel || ctx.member.voice.channel;
    if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a voice channel or join one.", ctx.guild)] }, 5);

    const members = channel.members.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No members in this channel.";
    const embed = UniversalEmbed.info(`Users in voice channel **${channel.name}**`, ctx.guild)
      .setDescription(members);

    return ctx.reply({ embeds: [embed] });
  }
};
