import { Command } from "../../../commands/command.js";
import { drawLeaderboardCard } from "../../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const inviteLeaderboardCommand: Command = {
  name: "inviteleaderboard",
  aliases: ["inviteslb"],
  description: "Display the invite leaderboard.",
  category: "Invite Tracking",
  usage: "inviteleaderboard",
  examples: ["inviteleaderboard"],
  execute: async (ctx) => {
    await ctx.reply("⏳ Generating leaderboard card...");

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

    const buffer = await drawLeaderboardCard("INVITE LEADERBOARD", entries);
    const attachment = new AttachmentBuilder(buffer, { name: "invite-leaderboard.png" });

    const embed = UniversalEmbed.info("Leaderboard", ctx.guild)
      .setDescription("Want to see more than the top 10?")
      .setImage("attachment://invite-leaderboard.png");

    return ctx.reply({ embeds: [embed], files: [attachment] });
  }
};
