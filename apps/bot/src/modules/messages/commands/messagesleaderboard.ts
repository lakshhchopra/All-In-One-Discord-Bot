import { Command } from "../../../commands/command.js";
import { drawLeaderboardCard } from "../../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";
import { prisma } from "../../../services/db.js";

export const messagesLeaderboardCommand: Command = {
  name: "messagesleaderboard",
  aliases: ["messageslb"],
  description: "Display top active chatters in this server.",
  category: "Message Tracking",
  usage: "messagesleaderboard",
  examples: ["messagesleaderboard"],
  execute: async (ctx) => {
    await ctx.reply("⏳ Generating message leaderboard card...");

    const topChatters = await prisma.memberStats.findMany({
      where: { guildId: ctx.guild.id, totalMessages: { gt: 0 } },
      orderBy: { totalMessages: "desc" },
      take: 7
    });

    const entries = await Promise.all(
      topChatters.map(async (stat) => {
        try {
          const user = await ctx.guild.members.fetch(stat.userId);
          return { username: user.user.username, value: `${stat.totalMessages} msgs` };
        } catch {
          return { username: `ID: ${stat.userId}`, value: `${stat.totalMessages} msgs` };
        }
      })
    );

    const buffer = await drawLeaderboardCard("MESSAGE LEADERBOARD", entries);
    const attachment = new AttachmentBuilder(buffer, { name: "messages-leaderboard.png" });

    return ctx.reply({ files: [attachment] });
  }
};
