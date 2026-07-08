import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const messagesCommand: Command = {
  name: "messages",
  aliases: ["msgstats"],
  description: "View message stats for yourself or another user.",
  category: "Message Tracking",
  usage: "messages [member]",
  examples: ["messages", "messages @member", "messages 982232494223020042"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("user", 0) || ctx.member;

    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
    });

    const total = stats?.totalMessages ?? 0;
    const daily = stats?.dailyMessages ?? 0;
    const weekly = stats?.weeklyMessages ?? 0;
    const monthly = stats?.monthlyMessages ?? 0;

    const embed = UniversalEmbed.info(`Message Statistics for **${target.user.tag}**`, ctx.guild)
      .setDescription(
        `• **Total Messages:** \`${total}\`\n` +
        `• **Daily Messages:** \`${daily}\`\n` +
        `• **Weekly Messages:** \`${weekly}\`\n` +
        `• **Monthly Messages:** \`${monthly}\``
      );

    return ctx.reply({ embeds: [embed] });
  }
};
