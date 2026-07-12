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
  execute: async (ctx: any) => {
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
            const member = await ctx.guild.members.fetch(stat.userId);
            return {
              username: member.displayName || member.user.username,
              value: stat.score,
              avatarUrl: member.user.displayAvatarURL({ extension: "png", size: 64 })
            };
          } catch {
            return { username: `ID: ${stat.userId}`, value: stat.score };
          }
        })
      );

      const buffer = await drawLeaderboardCard("COUNTING LEADERBOARD", entries);
      const attachment = new AttachmentBuilder(buffer, { name: "counting-leaderboard.png" });

      const embed = UniversalEmbed.info("Leaderboard", ctx.guild)
        .setDescription("Want to see more than the top 10?")
        .setImage("attachment://counting-leaderboard.png");

      return ctx.reply({ embeds: [embed], files: [attachment] });
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
            const member = await ctx.guild.members.fetch(stat.userId);
            return {
              username: member.displayName || member.user.username,
              value: stat.totalMessages,
              avatarUrl: member.user.displayAvatarURL({ extension: "png", size: 64 })
            };
          } catch {
            return { username: `ID: ${stat.userId}`, value: stat.totalMessages };
          }
        })
      );

      const buffer = await drawLeaderboardCard("MESSAGE LEADERBOARD", entries);
      const attachment = new AttachmentBuilder(buffer, { name: "messages-leaderboard.png" });

      const embed = UniversalEmbed.info("Leaderboard", ctx.guild)
        .setDescription("Want to see more than the top 10?")
        .setImage("attachment://messages-leaderboard.png");

      return ctx.reply({ embeds: [embed], files: [attachment] });
    }

    if (sub === "invites" || sub === "invite") {
      await ctx.reply("⏳ Generating invites leaderboard...");
      const allStats = await prisma.memberStats.findMany({
        where: { guildId: ctx.guild.id }
      });

      const mapped = allStats.map(stat => {
        const net = (stat.invitesCount || 0) + (stat.bonusInvites || 0) - (stat.fakeInvites || 0) - (stat.leftInvites || 0);
        return {
          userId: stat.userId,
          net
        };
      });

      const filtered = mapped.filter(item => item.net > 0);
      filtered.sort((a, b) => b.net - a.net);
      const topInvites = filtered.slice(0, 10);

      const entries = await Promise.all(
        topInvites.map(async (item) => {
          try {
            const member = await ctx.guild.members.fetch(item.userId);
            return {
              username: member.displayName || member.user.username,
              value: item.net,
              avatarUrl: member.user.displayAvatarURL({ extension: "png", size: 64 })
            };
          } catch {
            return { username: `ID: ${item.userId}`, value: item.net };
          }
        })
      );

      const buffer = await drawLeaderboardCard("INVITES LEADERBOARD", entries);
      const attachment = new AttachmentBuilder(buffer, { name: "invites-leaderboard.png" });

      const embed = UniversalEmbed.info("Leaderboard", ctx.guild)
        .setDescription("Want to see more than the top 10?")
        .setImage("attachment://invites-leaderboard.png");

      return ctx.reply({ embeds: [embed], files: [attachment] });
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
            const member = await ctx.guild.members.fetch(stat.userId);
            return {
              username: member.displayName || member.user.username,
              value: stat.dailyMessages,
              avatarUrl: member.user.displayAvatarURL({ extension: "png", size: 64 })
            };
          } catch {
            return { username: `ID: ${stat.userId}`, value: stat.dailyMessages };
          }
        })
      );

      const buffer = await drawLeaderboardCard("DAILY ACTIVITY LB", entries);
      const attachment = new AttachmentBuilder(buffer, { name: "daily-leaderboard.png" });

      const embed = UniversalEmbed.info("Leaderboard", ctx.guild)
        .setDescription("Want to see more than the top 10?")
        .setImage("attachment://daily-leaderboard.png");

      return ctx.reply({ embeds: [embed], files: [attachment] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `lb <count | messages | invites | dailymessage>`", ctx.guild)] });
  }
};

