import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { drawLeaderboardCard } from "../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";

export const invitesCommand: Command = {
  name: "invites",
  description: "View invite stats for yourself or another user.",
  category: "Invite Tracking",
  execute: async (ctx) => {
    const target = ctx.getMemberOption("user", 0) || ctx.member;

    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } }
    });

    const total = stats?.invitesCount ?? 0;
    const fake = stats?.fakeInvites ?? 0;
    const bonus = stats?.bonusInvites ?? 0;
    const left = stats?.leftInvites ?? 0;
    const net = Math.max(0, total + bonus - fake - left);

    const embed = UniversalEmbed.info(`Invites for **${target.user.tag}**`, ctx.guild)
      .setDescription(
        `• **Net Invites:** \`${net}\`\n` +
        `• **Total:** \`${total}\` | **Bonus:** \`${bonus}\`\n` +
        `• **Fake:** \`${fake}\` | **Left:** \`${left}\``
      );

    return ctx.reply({ embeds: [embed] });
  }
};

export const inviteLeaderboardCommand: Command = {
  name: "inviteleaderboard",
  aliases: ["inviteslb"],
  description: "Display the invite leaderboard.",
  category: "Invite Tracking",
  execute: async (ctx) => {
    await ctx.reply("⏳ Generating leaderboard card...");

    const topInvites = await prisma.memberStats.findMany({
      where: { guildId: ctx.guild.id, invitesCount: { gt: 0 } },
      orderBy: { invitesCount: "desc" },
      take: 7
    });

    const entries = await Promise.all(
      topInvites.map(async (stat) => {
        try {
          const user = await ctx.guild.members.fetch(stat.userId);
          const net = Math.max(0, stat.invitesCount + stat.bonusInvites - stat.fakeInvites - stat.leftInvites);
          return { username: user.user.username, value: `${net} invites` };
        } catch {
          const net = Math.max(0, stat.invitesCount + stat.bonusInvites - stat.fakeInvites - stat.leftInvites);
          return { username: `ID: ${stat.userId}`, value: `${net} invites` };
        }
      })
    );

    const buffer = await drawLeaderboardCard("INVITE LEADERBOARD", entries);
    const attachment = new AttachmentBuilder(buffer, { name: "invite-leaderboard.png" });

    return ctx.reply({ files: [attachment] });
  }
};

export const inviteRewardCommand: Command = {
  name: "invitereward",
  description: "Configure role rewards for invites.",
  category: "Invite Tracking",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // add, remove, list

    if (action === "add") {
      const inviteCount = ctx.getIntegerOption("count", 1);
      const role = ctx.getRoleOption("role", 2);

      if (inviteCount === null || !role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `invitereward add <inviteCount> <role>`", ctx.guild)] }, 5);
      }

      await prisma.inviteReward.upsert({
        where: { guildId_inviteCount: { guildId: ctx.guild.id, inviteCount } },
        update: { roleId: role.id },
        create: { guildId: ctx.guild.id, inviteCount, roleId: role.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added reward: Users with **${inviteCount}** invites will receive ${role}.`, ctx.guild)] });
    }

    if (action === "remove") {
      const inviteCount = ctx.getIntegerOption("count", 1);
      if (inviteCount === null) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `invitereward remove <inviteCount>`", ctx.guild)] }, 5);

      try {
        await prisma.inviteReward.delete({
          where: { guildId_inviteCount: { guildId: ctx.guild.id, inviteCount } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed reward for **${inviteCount}** invites.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Reward mapping not found.", ctx.guild)] }, 5);
      }
    }

    // List rewards
    const list = await prisma.inviteReward.findMany({ where: { guildId: ctx.guild.id } });
    const rewardDesc = list.map(item => `• **${item.inviteCount} Invites:** <@&${item.roleId}>`).join("\n") || "No invite rewards configured.";

    return ctx.reply({ embeds: [UniversalEmbed.info("Invite Role Rewards List", ctx.guild).setDescription(rewardDesc)] });
  }
};

export const inviteResetCommand: Command = {
  name: "invitereset",
  description: "Reset invites for a user or the entire server.",
  category: "Invite Tracking",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const target = ctx.getMemberOption("user", 0);

    if (target) {
      await prisma.memberStats.update({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: target.id } },
        data: { invitesCount: 0, fakeInvites: 0, bonusInvites: 0, leftInvites: 0 }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Reset invite stats for **${target.user.tag}**.`, ctx.guild)] });
    }

    await prisma.memberStats.updateMany({
      where: { guildId: ctx.guild.id },
      data: { invitesCount: 0, fakeInvites: 0, bonusInvites: 0, leftInvites: 0 }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("Reset all invites for this server.", ctx.guild)] });
  }
};

export function registerInvites() {
  CommandRegistry.register(invitesCommand);
  CommandRegistry.register(inviteLeaderboardCommand);
  CommandRegistry.register(inviteRewardCommand);
  CommandRegistry.register(inviteResetCommand);
}
