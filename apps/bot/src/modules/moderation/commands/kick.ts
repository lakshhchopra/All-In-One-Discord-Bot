import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const kickCommand: Command = {
  name: "kick",
  description: "Kick a member from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "kick <member> [reason]",
  examples: ["kick @member Trolling", "kick @member"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.KickMembers)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Kick Members`", ctx.guild)] }, 5);
    }

    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(kickCommand);

    const reason = ctx.args.slice(1).join(" ") || "No reason specified";
    if (!target.kickable) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This user cannot be kicked.", ctx.guild)] }, 5);
    }

    await target.kick(reason);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Kicked **${target.user.tag}** | Reason: ${reason}`, ctx.guild)] });
  }
};
