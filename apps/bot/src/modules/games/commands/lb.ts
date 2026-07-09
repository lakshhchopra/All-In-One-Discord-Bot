import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { drawLeaderboardCard } from "../../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";

export const lbCommand: Command = {
  name: "lb",
  description: "Display local leaderboards for counting, messages, invites, or daily activity.",
  category: "Mini Games",
  aliases: ["leaderboard"],
  usage: "lb <count | messages | invites | dailymessage>",
  examples: [
    "lb count",
    "lb messages",
    "lb invites"
  ],
  execute: async (ctx) => {
    const sub = ctx.getStringOption("type", 0)?.toLowerCase();

    if (sub === "count" || sub === "counting") {
      await ctx.reply("⏳ Generating counting leaderboard...");
      const topCount = await prisma.countingStats.findMany({
        where: { guildId: ctx.guild.id, score: { gt: 0 } },
        orderBy: { score: "desc" },
        take: 10
      });

      const entries = await Promise.all(
        topCount.map(async (stat) => {
          try {
            const user = await ctx.guild.members.fetch(stat.userId);
            return { username: user.user.username, value: `${stat.score} counts` };
          } catch {
            return { username: `ID: ${stat.userId}`, value: `${stat.score} counts` };
          }
        })
      );

      const buffer = await drawLeaderboardCard("COUNTING LEADERBOARD", entries);
      const attachment = new AttachmentBuilder(buffer, { name: "counting-leaderboard.png" });
      return ctx.reply({ files: [attachment] });
    }

    if (sub === "messages" || sub === "message") {
      await ctx.reply("⏳ Generating messages leaderboard...");
      const topMsg = await prisma.memberStats.findMany({
        where: { guildId: ctx.guild.id, totalMessages: { gt: 0 } },
        orderBy: { totalMessages: "desc" },
        take: 10
      });

      const entries = await Promise.all(
        topMsg.map(async (stat) => {
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

    if (sub === "invites" || sub === "invite") {
      await ctx.reply("⏳ Generating invites leaderboard...");
      const topInv = await prisma.memberStats.findMany({
        where: { guildId: ctx.guild.id, invitesCount: { gt: 0 } },
        orderBy: { invitesCount: "desc" },
        take: 10
      });

      const entries = await Promise.all(
        topInv.map(async (stat) => {
          try {
            const user = await ctx.guild.members.fetch(stat.userId);
            return { username: user.user.username, value: `${stat.invitesCount} invites` };
          } catch {
            return { username: `ID: ${stat.userId}`, value: `${stat.invitesCount} invites` };
          }
        })
      );

      const buffer = await drawLeaderboardCard("INVITES LEADERBOARD", entries);
      const attachment = new AttachmentBuilder(buffer, { name: "invites-leaderboard.png" });
      return ctx.reply({ files: [attachment] });
    }

    if (sub === "dailymessage" || sub === "dailymsg") {
      await ctx.reply("⏳ Generating daily messages leaderboard...");
      const topDaily = await prisma.memberStats.findMany({
        where: { guildId: ctx.guild.id, dailyMessages: { gt: 0 } },
        orderBy: { dailyMessages: "desc" },
        take: 10
      });

      const entries = await Promise.all(
        topDaily.map(async (stat) => {
          try {
            const user = await ctx.guild.members.fetch(stat.userId);
            return { username: user.user.username, value: `${stat.dailyMessages} msgs` };
          } catch {
            return { username: `ID: ${stat.userId}`, value: `${stat.dailyMessages} msgs` };
          }
        })
      );

      const buffer = await drawLeaderboardCard("DAILY ACTIVITY LB", entries);
      const attachment = new AttachmentBuilder(buffer, { name: "daily-leaderboard.png" });
      return ctx.reply({ files: [attachment] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `lb <count | messages | invites | dailymessage>`", ctx.guild)] });
  }
};
