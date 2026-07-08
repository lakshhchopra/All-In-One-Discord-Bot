import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const lbCountCommand: Command = {
  name: "lbcount",
  aliases: ["countinglb"],
  description: "Display counting game high scores.",
  category: "Games",
  usage: "lbcount",
  examples: ["lbcount"],
  execute: async (ctx) => {
    const state = await prisma.countState.findUnique({ where: { guildId: ctx.guild.id } });
    if (!state) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Counting game has not been configured in this server.", ctx.guild)] }, 5);
    }

    const embed = UniversalEmbed.info("Counting Game Status", ctx.guild)
      .addFields(
        { name: "Current Count", value: `\`${state.currentCount}\``, inline: true },
        { name: "High Score", value: `\`${state.highScore}\``, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  }
};
