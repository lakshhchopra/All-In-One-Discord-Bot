import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const voicekickCommand: Command = {
  name: "voicekick",
  aliases: ["voice kick"],
  description: "Disconnect a member from their voice channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voicekick <@member>",
  examples: ["voicekick @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(voicekickCommand);
    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not in a voice channel.`, ctx.guild)] }, 5);
    }
    await target.voice.disconnect(`Disconnected by ${ctx.user.tag}`);
    return ctx.reply({ embeds: [UniversalEmbed.success(`🚪 Disconnected **${target.user.tag}** from voice.`, ctx.guild)] });
  }
};
