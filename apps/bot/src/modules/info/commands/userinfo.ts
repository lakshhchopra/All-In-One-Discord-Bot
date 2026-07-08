import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const userinfoCommand: Command = {
  name: "userinfo",
  description: "Get detailed information about a member.",
  category: "Information",
  usage: "userinfo [member]",
  examples: ["userinfo", "userinfo @member", "userinfo 982232494223020042"],
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0) || ctx.member;

    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: member.id } }
    });

    const embed = UniversalEmbed.info(`User Info: ${member.user.tag}`, ctx.guild)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "User ID", value: `\`${member.id}\``, inline: true },
        { name: "Nickname", value: member.nickname ?? "None", inline: true },
        { name: "Bot?", value: member.user.bot ? "Yes" : "No", inline: true },
        { name: "Created At", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Joined At", value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`, inline: true },
        { name: "Messages", value: `\`${stats?.totalMessages ?? 0}\``, inline: true }
      );

    return ctx.reply({ embeds: [embed] });
  }
};
