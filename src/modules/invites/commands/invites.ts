import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const invitesCommand: Command = {
  name: "invites",
  description: "View invite stats for yourself or another user.",
  category: "Invite Tracking",
  usage: "invites [member]",
  examples: ["invites", "invites @member", "invites 982232494223020042"],
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
