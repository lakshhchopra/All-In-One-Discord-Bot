import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const nicknameCommand: Command = {
  name: "nickname",
  description: "Change the nickname of a member.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "nickname <member> [new_nickname]",
  examples: ["nickname @member Butterfly", "nickname @member"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Nicknames`", ctx.guild)] }, 5);
    }

    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.wrongUsage(nicknameCommand);

    const nick = ctx.args.slice(1).join(" ");
    await member.setNickname(nick || null);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Nickname updated for **${member.user.tag}**`, ctx.guild)] });
  }
};
