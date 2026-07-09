import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const voicedeafenCommand: Command = {
  name: "voicedeafen",
  aliases: ["voice deafen"],
  description: "Server-deafen a member in their voice channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voicedeafen <@member>",
  examples: ["voicedeafen @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(voicedeafenCommand);
    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not in a voice channel.`, ctx.guild)] }, 5);
    }
    await target.voice.setDeaf(true, `Deafened by ${ctx.user.tag}`);
    return ctx.reply({ embeds: [UniversalEmbed.success(`🔕 Deafened **${target.user.tag}**.`, ctx.guild)] });
  }
};
