import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const voiceundeafenCommand: Command = {
  name: "voiceundeafen",
  aliases: ["voice undeafen"],
  description: "Remove server-deafen from a member in their voice channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voiceundeafen <@member>",
  examples: ["voiceundeafen @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(voiceundeafenCommand);
    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not in a voice channel.`, ctx.guild)] }, 5);
    }
    await target.voice.setDeaf(false, `Undeafened by ${ctx.user.tag}`);
    return ctx.reply({ embeds: [UniversalEmbed.success(`🔔 Undeafened **${target.user.tag}**.`, ctx.guild)] });
  }
};
