import { Command } from "../../../commands/command.js";
import { drawLeaderboardCard } from "../../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";
import { prisma } from "../../../services/db.js";

export const inviteLeaderboardCommand: Command = {
  name: "inviteleaderboard",
  aliases: ["inviteslb"],
  description: "Display the invite leaderboard.",
  category: "Invite Tracking",
  usage: "inviteleaderboard",
  examples: ["inviteleaderboard"],
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
