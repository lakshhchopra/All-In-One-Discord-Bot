import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const inviteResetCommand: Command = {
  name: "invitereset",
  description: "Reset invites for a user or the entire server.",
  category: "Invite Tracking",
  permissionLevel: "ADMIN",
  usage: "invitereset [member]",
  examples: [
    "invitereset @member",
    "invitereset"
  ],
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
