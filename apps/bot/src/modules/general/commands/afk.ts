import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const afkCommand: Command = {
  name: "afk",
  description: "Set yourself as AFK.",
  category: "Information",
  usage: "afk [message]",
  examples: ["afk studying", "afk"],
  execute: async (ctx) => {
    const reason = ctx.args.join(" ") || "AFK";

    await prisma.memberStats.upsert({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: ctx.user.id } },
      update: { afkMessage: reason, afkSince: new Date() },
      create: { guildId: ctx.guild.id, userId: ctx.user.id, afkMessage: reason, afkSince: new Date() }
    });

    try {
      if (ctx.member.kickable && !ctx.member.permissions.has("Administrator")) {
        await ctx.member.setNickname(`[AFK] ${ctx.member.displayName}`);
      }
    } catch {}

    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully set your AFK: ${reason}`, ctx.guild)] });
  }
};
