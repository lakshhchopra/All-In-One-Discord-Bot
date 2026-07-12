import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { isWhitelisted } from "../../../../utils/security.js";

export const kickCommand: Command = {
  name: "kick",
  description: "Kick a member from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "kick <member> [reason]",
  examples: ["kick @member Trolling", "kick @member"],
  execute: async (ctx) => {
    const whitelisted = await isWhitelisted(ctx.guild, ctx.user.id, "kick");
    if (!whitelisted) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not authorized by the owner to kick members.", ctx.guild)] }, 5);
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
