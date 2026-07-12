import { Command } from "../../../commands/command.js";
import { TextChannel } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const grerollCommand: Command = {
  name: "greroll",
  description: "Reroll winners for an ended giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  usage: "greroll <messageId>",
  examples: ["greroll 1135816865055256688"],
  execute: async (ctx: any) => {
    const messageId = ctx.getStringOption("messageId", 0);
    if (!messageId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `greroll <messageId>`", ctx.guild)] }, 5);

    const giveaway = await prisma.giveaway.findUnique({ where: { id: messageId } });
    if (!giveaway || !giveaway.ended) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Giveaway not found or not ended yet.", ctx.guild)] }, 5);
    }

    const entries = giveaway.entries;
    if (entries.length === 0) {
      return ctx.reply({ embeds: [UniversalEmbed.warning("No entries to choose from.", ctx.guild)] }, 5);
    }

    const winners: string[] = [];
    const tempEntries = [...entries];
    const winnersCount = Math.min(giveaway.winnerCount, tempEntries.length);

    for (let i = 0; i < winnersCount; i++) {
      const idx = Math.floor(Math.random() * tempEntries.length);
      winners.push(tempEntries.splice(idx, 1)[0]);
    }

    await prisma.giveaway.update({
      where: { id: messageId },
      data: { winners }
    });

    try {
      const ch = await ctx.guild.channels.fetch(giveaway.channelId) as TextChannel;
      await ch.send(`🎉 **Reroll:** Congratulations to the new winners of **${giveaway.prize}**: ${winners.map(id => `<@${id}>`).join(", ")}!`);
    } catch {}

    return ctx.reply({ embeds: [UniversalEmbed.success("Giveaway rerolled successfully.", ctx.guild)] });
  }
};

