import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { isWhitelisted } from "../../../../utils/security.js";

export const softbanCommand: Command = {
  name: "softban",
  description: "Ban and immediately unban a member to delete their recent messages.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "softban <@member> [days] [reason]",
  examples: ["softban @member", "softban @member 7 Spamming"],
  execute: async (ctx) => {
    const allowed = await isWhitelisted(ctx.guild, ctx.user.id, "ban");
    if (!allowed) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not authorized to softban members.", ctx.guild)] }, 5);
    }

    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(softbanCommand);

    if (!target.bannable) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This user cannot be banned (role hierarchy issue).", ctx.guild)] }, 5);
    }

    // Parse optional days argument (default 1 day of message deletion)
    const secondArg = ctx.args[1];
    const days = secondArg && /^\d+$/.test(secondArg) ? Math.min(parseInt(secondArg, 10), 7) : 1;
    const reason = ctx.args.slice(secondArg && /^\d+$/.test(secondArg) ? 2 : 1).join(" ") || "Softban: No reason specified";

    await ctx.guild.members.ban(target.id, { deleteMessageSeconds: days * 86400, reason });
    await ctx.guild.members.unban(target.id, "Softban: auto-unban after message deletion");

    return ctx.reply({
      embeds: [
        UniversalEmbed.success(
          `🔨 Softbanned **${target.user.tag}** | Deleted ${days} day(s) of messages.\n**Reason:** ${reason}`,
          ctx.guild
        )
      ]
    });
  }
};
