import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const messagesResetCommand: Command = {
  name: "messagesreset",
  description: "Reset message counts for a member or the entire server.",
  category: "Message Tracking",
  permissionLevel: "ADMIN",
  usage: "messagesreset [member]",
  examples: [
    "messagesreset @member",
    "messagesreset"
  ],
  execute: async (ctx: any) => {
    const target = ctx.getMemberOption("user", 0);

    if (target) {
      await prisma.memberStats.update({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } },
        data: { totalMessages: 0, dailyMessages: 0, weeklyMessages: 0, monthlyMessages: 0 }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Reset message counts for **${target.user.tag}**.`, ctx.guild)] });
    }

    await prisma.memberStats.updateMany({
      where: { guildId: ctx.guild.id },
      data: { totalMessages: 0, dailyMessages: 0, weeklyMessages: 0, monthlyMessages: 0 }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("Reset message counts for everyone.", ctx.guild)] });
  }
};

