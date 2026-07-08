import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const banCommand: Command = {
  name: "ban",
  description: "Ban a member from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "ban <member> [reason]",
  examples: ["ban @member Spamming", "ban @member"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Ban Members`", ctx.guild)] }, 5);
    }

    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(banCommand);

    const reason = ctx.args.slice(1).join(" ") || "No reason specified";
    if (!target.bannable) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This user cannot be banned (role hierarchy issue).", ctx.guild)] }, 5);
    }

    await target.ban({ reason });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Banned **${target.user.tag}** | Reason: ${reason}`, ctx.guild)] });
  }
};
