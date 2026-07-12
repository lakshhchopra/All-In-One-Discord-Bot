import { Command } from "../../../commands/command.js";
import { EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getCache, deleteCache } from "../../../services/redis.js";

interface PausedData {
  remainingMs: number;
}

export const gresumeCommand: Command = {
  name: "gresume",
  description: "Resume a paused giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  usage: "gresume <messageId>",
  examples: ["gresume 1135816865055256688"],
  execute: async (ctx: any) => {
    const messageId = ctx.getStringOption("messageId", 0);
    if (!messageId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `gresume <messageId>`", ctx.guild)] }, 5);

    const giveaway = await prisma.giveaway.findUnique({ where: { id: messageId } });
    if (!giveaway) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Giveaway not found.", ctx.guild)] }, 5);
    }
    if (giveaway.ended) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This giveaway has already ended.", ctx.guild)] }, 5);
    }

    const pausedData = await getCache<PausedData>(`giveaway_paused:${messageId}`);
    if (!pausedData) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This giveaway is not paused.", ctx.guild)] }, 5);
    }

    const newEndsAt = new Date(Date.now() + pausedData.remainingMs);

    // Update endsAt and remove cache entry
    await prisma.giveaway.update({
      where: { id: messageId },
      data: { endsAt: newEndsAt }
    });
    await deleteCache(`giveaway_paused:${messageId}`);

    // Update embed in channel
    try {
      const ch = await ctx.guild.channels.fetch(giveaway.channelId) as TextChannel;
      const msg = await ch.messages.fetch(messageId);
      if (msg && msg.embeds[0]) {
        const oldEmbed = msg.embeds[0];
        const newEmbed = EmbedBuilder.from(oldEmbed)
          .setTitle("🎉 GIVEAWAY 🎉")
          .setDescription(
            `**Prize:** ${giveaway.prize}\n` +
            `**Winners:** ${giveaway.winnerCount}\n` +
            `**Hosted By:** <@${giveaway.hostedBy}>\n` +
            `**Ends:** <t:${Math.floor(newEndsAt.getTime() / 1000)}:R>`
          )
          .setColor(0x5865f2)
          .setTimestamp(newEndsAt);

        await msg.edit({ embeds: [newEmbed] });
      }
    } catch {}

    return ctx.reply({ embeds: [UniversalEmbed.success("Giveaway resumed successfully.", ctx.guild)] });
  }
};

