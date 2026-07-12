import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { isWhitelisted } from "../../../../utils/security.js";

export const banCommand: Command = {
  name: "ban",
  description: "Ban a member from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "ban <member> [reason]",
  examples: ["ban @member Spamming", "ban @member"],
  execute: async (ctx) => {
    const whitelisted = await isWhitelisted(ctx.guild, ctx.user.id, "ban");
    if (!whitelisted) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not authorized by the owner to ban members.", ctx.guild)] }, 5);
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
