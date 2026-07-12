import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const messageCommand: Command = {
  name: "message",
  description: "View and manage message counts and statistics.",
  category: "Messagings & Invites",
  aliases: ["messages", "dailymessage", "msg"],
  usage: "message [member | add | reset] [@user] [count]",
  examples: [
    "message",
    "message @user",
    "message add @user 100",
    "message reset @user"
  ],
  execute: async (ctx: any) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();
    const cmd = ctx.commandName.toLowerCase();

    // Check if directly checking daily messages or messages
    if (!action || (!["add", "reset"].includes(action) && !action.startsWith("<@"))) {
      const target = ctx.getMemberOption("member", 0) || ctx.member;
      const stats = await prisma.memberStats.findUnique({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
      });

      const total = stats?.totalMessages || 0;
      const daily = stats?.dailyMessages || 0;

      if (cmd === "dailymessage") {
        return ctx.reply({ embeds: [UniversalEmbed.info(`Daily Message Count`, ctx.guild).setDescription(`**${target.user.tag}** has sent **${daily}** messages today.`)] });
      }

      return ctx.reply({
        embeds: [
          UniversalEmbed.info(`Message Statistics`, ctx.guild)
            .setDescription(
              `**${target.user.tag}** Message Stats:\n` +
              `- **Total Messages:** \`${total}\`\n` +
              `- **Daily Messages:** \`${daily}\``
            )
        ]
      });
    }

    // Admin management actions
    if (action === "add") {
      const target = ctx.getMemberOption("member", 1);
      const amount = ctx.getIntegerOption("count", 2);

      if (!target || amount === null) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `message add <@user> <count>`", ctx.guild)] }, 5);
      }

      const stats = await prisma.memberStats.upsert({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } },
        update: { totalMessages: { increment: amount } },
        create: { guildId: ctx.guild.id, userId: target.id, totalMessages: amount }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${amount}** messages to **${target.user.tag}** (New Total: ${stats.totalMessages}).`, ctx.guild)] });
    }

    if (action === "reset") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `message reset <@user>`", ctx.guild)] }, 5);
      }

      await prisma.memberStats.upsert({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } },
        update: { totalMessages: 0, dailyMessages: 0 },
        create: { guildId: ctx.guild.id, userId: target.id, totalMessages: 0, dailyMessages: 0 }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Reset message stats for **${target.user.tag}**.`, ctx.guild)] });
    }

    // Fallback member lookup if first argument is member mention
    const memberId = action.replace(/[<@!>]/g, "");
    try {
      const target = await ctx.guild.members.fetch(memberId);
      const stats = await prisma.memberStats.findUnique({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
      });
      const total = stats?.totalMessages || 0;
      const daily = stats?.dailyMessages || 0;

      return ctx.reply({
        embeds: [
          UniversalEmbed.info(`Message Statistics`, ctx.guild)
            .setDescription(
              `**${target.user.tag}** Message Stats:\n` +
              `- **Total Messages:** \`${total}\`\n` +
              `- **Daily Messages:** \`${daily}\``
            )
        ]
      });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `message [member | add | reset] [@user] [count]`", ctx.guild)] });
    }
  }
};

