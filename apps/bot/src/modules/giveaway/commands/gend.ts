import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";
import { endGiveaway } from "../scheduler.js";

export const gendCommand: Command = {
  name: "gend",
  description: "End a giveaway early and choose winners.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  usage: "gend <messageId>",
  examples: ["gend 1135816865055256688"],
  execute: async (ctx: any) => {
    const messageId = ctx.getStringOption("messageId", 0);
    if (!messageId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `gend <messageId>`", ctx.guild)] }, 5);

    const giveaway = await prisma.giveaway.findUnique({ where: { id: messageId } });
    if (!giveaway) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Giveaway not found.", ctx.guild)] }, 5);
    }
    if (giveaway.ended) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This giveaway has already ended.", ctx.guild)] }, 5);
    }

    const winners = await endGiveaway(messageId, ctx.guild.client);

    if (winners === null) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to end giveaway.", ctx.guild)] }, 5);
    }

    if (winners.length === 0) {
      return ctx.reply({ embeds: [UniversalEmbed.warning("Giveaway ended — no entries, no winners.", ctx.guild)] });
    }

    return ctx.reply({
      embeds: [
        UniversalEmbed.success(
          `Giveaway ended! Winners: ${winners.map((id) => `<@${id}>`).join(", ")}`,
          ctx.guild
        )
      ]
    });
  }
};

