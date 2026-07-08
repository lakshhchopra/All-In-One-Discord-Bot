import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const dailyMessagesCommand: Command = {
  name: "dailymessages",
  description: "View daily message activity stats.",
  category: "Message Tracking",
  usage: "dailymessages [member]",
  examples: ["dailymessages", "dailymessages @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("user", 0) || ctx.member;
    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
    });
    return ctx.reply({ embeds: [UniversalEmbed.info(`Daily Message Count for **${target.user.tag}**`, ctx.guild).setDescription(`\`${stats?.dailyMessages ?? 0}\` messages today.`)] });
  }
};
