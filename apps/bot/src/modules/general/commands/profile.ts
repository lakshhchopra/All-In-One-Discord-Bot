import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const profileCommand: Command = {
  name: "profile",
  description: "View the overall stats and information of a member.",
  category: "General Commands",
  usage: "profile [member]",
  examples: ["profile", "profile @member"],
  execute: async (ctx: any) => {
    const member = ctx.getMemberOption("member", 0) || ctx.member;

    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: member.id } }
    });

    const messages = stats?.totalMessages ?? 0;
    const voiceSec = stats?.voiceTimeSeconds ?? 0;
    const voiceHr = (voiceSec / 3600).toFixed(1);
    const dailyMsgs = stats?.dailyMessages ?? 0;

    const embed = UniversalEmbed.neutral(`${member.user.tag}'s Profile`, ctx.guild)
      .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
      .addFields(
        { name: "Total Messages", value: `\`${messages}\` messages`, inline: true },
        { name: "Daily Activity", value: `\`${dailyMsgs}\` messages today`, inline: true },
        { name: "Voice Time", value: `\`${voiceHr}\` hours`, inline: true },
        { name: "Joined Server", value: `<t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:R>`, inline: false }
      );

    return ctx.reply({ embeds: [embed] });
  }
};

