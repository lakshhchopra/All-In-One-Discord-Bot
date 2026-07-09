import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const invitesCommand: Command = {
  name: "invites",
  description: "View and manage invite statistics.",
  category: "Messagings & Invites",
  aliases: ["invite"],
  usage: "invites [member | add | reset] [@user] [count]",
  examples: [
    "invites",
    "invites @user",
    "invites add @user 5",
    "invites reset @user"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action || (!["add", "reset"].includes(action) && !action.startsWith("<@"))) {
      const target = ctx.getMemberOption("member", 0) || ctx.member;
      const stats = await prisma.memberStats.findUnique({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
      });

      const regular = stats?.invitesCount || 0;
      const bonus = stats?.bonusInvites || 0;
      const fake = stats?.fakeInvites || 0;
      const left = stats?.leftInvites || 0;
      const total = regular + bonus - fake - left;

      return ctx.reply({
        embeds: [
          UniversalEmbed.info(`Invite Statistics`, ctx.guild)
            .setDescription(
              `**${target.user.tag}** Invite Stats:\n` +
              `- **Total Invites:** \`${total}\` (Net)\n` +
              `- **Regular:** \`${regular}\` | **Bonus:** \`${bonus}\` | **Fake:** \`${fake}\` | **Left:** \`${left}\``
            )
        ]
      });
    }

    if (action === "add" || action === "invites add") {
      const target = ctx.getMemberOption("member", 1);
      const amount = ctx.getIntegerOption("count", 2);

      if (!target || amount === null) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `invites add <@user> <count>`", ctx.guild)] }, 5);
      }

      const stats = await prisma.memberStats.upsert({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } },
        update: { bonusInvites: { increment: amount } },
        create: { guildId: ctx.guild.id, userId: target.id, bonusInvites: amount }
      });

      const net = (stats.invitesCount || 0) + (stats.bonusInvites || 0) - (stats.fakeInvites || 0) - (stats.leftInvites || 0);

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${amount}** bonus invites to **${target.user.tag}** (New Total: ${net}).`, ctx.guild)] });
    }

    if (action === "reset" || action === "invite reset") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `invites reset <@user>`", ctx.guild)] }, 5);
      }

      await prisma.memberStats.upsert({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } },
        update: { invitesCount: 0, bonusInvites: 0, fakeInvites: 0, leftInvites: 0 },
        create: { guildId: ctx.guild.id, userId: target.id, invitesCount: 0, bonusInvites: 0, fakeInvites: 0, leftInvites: 0 }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Reset invite stats for **${target.user.tag}**.`, ctx.guild)] });
    }

    const memberId = action.replace(/[<@!>]/g, "");
    try {
      const target = await ctx.guild.members.fetch(memberId);
      const stats = await prisma.memberStats.findUnique({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
      });
      const regular = stats?.invitesCount || 0;
      const bonus = stats?.bonusInvites || 0;
      const fake = stats?.fakeInvites || 0;
      const left = stats?.leftInvites || 0;
      const total = regular + bonus - fake - left;

      return ctx.reply({
        embeds: [
          UniversalEmbed.info(`Invite Statistics`, ctx.guild)
            .setDescription(
              `**${target.user.tag}** Invite Stats:\n` +
              `- **Total Invites:** \`${total}\` (Net)\n` +
              `- **Regular:** \`${regular}\` | **Bonus:** \`${bonus}\` | **Fake:** \`${fake}\` | **Left:** \`${left}\``
            )
        ]
      });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `invites [member | add | reset] [@user] [count]`", ctx.guild)] });
    }
  }
};
