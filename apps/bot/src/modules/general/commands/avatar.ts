import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const avatarCommand: Command = {
  name: "avatar",
  description: "View avatar of a user.",
  category: "Information",
  usage: "avatar [member]",
  examples: ["avatar", "avatar @member"],
  execute: async (ctx) => {
    const member = ctx.getMemberOption("user", 0) || ctx.member;
    const url = member.user.displayAvatarURL({ size: 1024 });

    const embed = UniversalEmbed.neutral(`Avatar of ${member.user.tag}`, ctx.guild)
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
};
