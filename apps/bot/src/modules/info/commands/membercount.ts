import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const membercountCommand: Command = {
  name: "membercount",
  description: "View detailed server member count.",
  category: "Information",
  usage: "membercount",
  examples: ["membercount"],
  execute: async (ctx) => {
    const total = ctx.guild.memberCount;
    const bots = ctx.guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;

    const embed = UniversalEmbed.info("Member Count Breakdown", ctx.guild)
      .addFields(
        { name: "Humans", value: `\`${humans}\``, inline: true },
        { name: "Bots", value: `\`${bots}\``, inline: true },
        { name: "Total", value: `\`${total}\``, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  }
};
