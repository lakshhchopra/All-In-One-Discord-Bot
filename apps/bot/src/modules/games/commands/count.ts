import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const countCommand: Command = {
  name: "count",
  description: "Check your own or another member's counting score.",
  category: "Mini Games",
  usage: "count [@member]",
  examples: [
    "count",
    "count @member"
  ],
  execute: async (ctx: any) => {
    const target = ctx.getMemberOption("member", 0) || ctx.member;
    const stat = await prisma.countingStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
    });

    const score = stat?.score || 0;
    return ctx.reply({
      embeds: [
        UniversalEmbed.info("Counting Score", ctx.guild)
          .setDescription(`**${target.user.tag}** has successfully counted **${score}** times.`)
      ]
    });
  }
};

