import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const vcdeafenCommand: Command = {
  name: "vcdeafen",
  description: "Deafens a user in a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  usage: "vcdeafen <member>",
  examples: ["vcdeafen @member"],
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setDeaf(true);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Deafened **${member.user.tag}**`, ctx.guild)] });
  }
};
