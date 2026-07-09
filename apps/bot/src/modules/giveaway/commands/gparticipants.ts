import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const gparticipantsCommand: Command = {
  name: "gparticipants",
  aliases: ["gentries", "glist"],
  description: "View all participants in a giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  usage: "gparticipants <messageId>",
  examples: ["gparticipants 1135816865055256688"],
  execute: async (ctx) => {
    const messageId = ctx.getStringOption("messageId", 0);
    if (!messageId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `gparticipants <messageId>`", ctx.guild)] }, 5);

    const giveaway = await prisma.giveaway.findUnique({ where: { id: messageId } });
    if (!giveaway) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Giveaway not found.", ctx.guild)] }, 5);
    }

    const entries = giveaway.entries;
    if (entries.length === 0) {
      return ctx.reply({ embeds: [UniversalEmbed.info("There are no entries in this giveaway yet.", ctx.guild)] });
    }

    const mentionList = entries.map(id => `<@${id}>`).slice(0, 50).join(", ");
    const description =
      `📋 **Entrants List:**\n\n${mentionList}` +
      (entries.length > 50 ? `\n... and **${entries.length - 50}** more.` : "");

    const embed = UniversalEmbed.neutral(`Entrants for ${giveaway.prize}`, ctx.guild)
      .setDescription(description)
      .setFooter({ text: `Total Entrants: ${entries.length}` });

    return ctx.reply({ embeds: [embed] });
  }
};
