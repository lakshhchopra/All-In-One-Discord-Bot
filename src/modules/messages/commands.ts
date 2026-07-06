import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { drawLeaderboardCard } from "../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";

export const messagesCommand: Command = {
  name: "messages",
  aliases: ["msgstats"],
  description: "View message stats for yourself or another user.",
  category: "Message Tracking",
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

export const messagesLeaderboardCommand: Command = {
  name: "messagesleaderboard",
  aliases: ["messageslb"],
  description: "Display top active chatters in this server.",
  category: "Message Tracking",
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

export const dailyMessagesCommand: Command = {
  name: "dailymessages",
  description: "View daily message activity stats.",
  category: "Message Tracking",
  execute: async (ctx) => {
    const target = ctx.getMemberOption("user", 0) || ctx.member;
    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
    });
    return ctx.reply({ embeds: [UniversalEmbed.info(`Daily Message Count for **${target.user.tag}**`, ctx.guild).setDescription(`\`${stats?.dailyMessages ?? 0}\` messages today.`)] });
  }
};

export const messagesResetCommand: Command = {
  name: "messagesreset",
  description: "Reset message counts for a member or the entire server.",
  category: "Message Tracking",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
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

export function registerMessages() {
  CommandRegistry.register(messagesCommand);
  CommandRegistry.register(messagesLeaderboardCommand);
  CommandRegistry.register(dailyMessagesCommand);
  CommandRegistry.register(messagesResetCommand);
}
