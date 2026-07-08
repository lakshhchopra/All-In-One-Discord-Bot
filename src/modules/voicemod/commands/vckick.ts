import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const vckickCommand: Command = {
  name: "vckick",
  description: "Kicks a user out of a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  usage: "vckick <member>",
  examples: ["vckick @member"],
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.disconnect("Voice kicked by moderator");
    return ctx.reply({ embeds: [UniversalEmbed.success(`Disconnected **${member.user.tag}** from voice channel.`, ctx.guild)] });
  }
};
