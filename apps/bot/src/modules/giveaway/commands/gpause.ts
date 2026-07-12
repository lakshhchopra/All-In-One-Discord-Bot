import { Command } from "../../../commands/command.js";
import { EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { setCache, getCache } from "../../../services/redis.js";

export const gpauseCommand: Command = {
  name: "gpause",
  description: "Pause an active giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  usage: "gpause <messageId>",
  examples: ["gpause 1135816865055256688"],
  execute: async (ctx: any) => {
    const messageId = ctx.getStringOption("messageId", 0);
    if (!messageId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `gpause <messageId>`", ctx.guild)] }, 5);

    const giveaway = await prisma.giveaway.findUnique({ where: { id: messageId } });
    if (!giveaway) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Giveaway not found.", ctx.guild)] }, 5);
    }
    if (giveaway.ended) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This giveaway has already ended.", ctx.guild)] }, 5);
    }

    const isAlreadyPaused = await getCache(`giveaway_paused:${messageId}`);
    if (isAlreadyPaused) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This giveaway is already paused.", ctx.guild)] }, 5);
    }

    const remainingMs = giveaway.endsAt.getTime() - Date.now();
    if (remainingMs <= 0) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This giveaway is about to end and cannot be paused.", ctx.guild)] }, 5);
    }

    // Save remaining time in cache
    await setCache(`giveaway_paused:${messageId}`, { remainingMs });

    // Set endsAt in DB to a far-future date (50 years) so the scheduler won't end it
    const farFuture = new Date(Date.now() + 50 * 365 * 24 * 60 * 60 * 1000);
    await prisma.giveaway.update({
      where: { id: messageId },
      data: { endsAt: farFuture }
    });

    // Update Embed in channel
    try {
      const ch = await ctx.guild.channels.fetch(giveaway.channelId) as TextChannel;
      const msg = await ch.messages.fetch(messageId);
      if (msg && msg.embeds[0]) {
        const oldEmbed = msg.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
          .setTitle("⏸️ GIVEAWAY PAUSED ⏸️")
          .setDescription(
            `**Prize:** ${giveaway.prize}\n` +
            `**Winners:** ${giveaway.winnerCount}\n` +
            `**Status:** ⏸️ Paused by moderator\n` +
            `**Hosted By:** <@${giveaway.hostedBy}>`
          )
          .setColor(0xe67e22)
          .setTimestamp(null);

        await msg.edit({ embeds: [newEmbed] });
      }
    } catch {}

    return ctx.reply({ embeds: [UniversalEmbed.success("Giveaway paused successfully.", ctx.guild)] });
  }
};

