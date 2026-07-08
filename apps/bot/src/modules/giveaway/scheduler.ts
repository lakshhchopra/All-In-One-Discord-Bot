import { Client, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "../../services/db.js";

/**
 * Pick random winners from an entries array without repeats.
 */
export function pickWinners(entries: string[], count: number): string[] {
  const pool = [...entries];
  const winners: string[] = [];
  const take = Math.min(count, pool.length);
  for (let i = 0; i < take; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    winners.push(pool.splice(idx, 1)[0]);
  }
  return winners;
}

/**
 * End a giveaway by ID — selects winners, updates the embed, sends announcement.
 * Returns the list of winner IDs, or null if the giveaway was already ended / not found.
 */
export async function endGiveaway(
  giveawayId: string,
  client: Client
): Promise<string[] | null> {
  const giveaway = await prisma.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway || giveaway.ended) return null;

  const winners =
    giveaway.entries.length > 0
      ? pickWinners(giveaway.entries as string[], giveaway.winnerCount)
      : [];

  await prisma.giveaway.update({
    where: { id: giveawayId },
    data: { ended: true, winners }
  });

  try {
    const guild = await client.guilds.fetch(giveaway.guildId).catch(() => null);
    if (!guild) return winners;

    const ch = await guild.channels.fetch(giveaway.channelId).catch(() => null) as TextChannel | null;
    if (!ch) return winners;

    const msg = await ch.messages.fetch(giveaway.id).catch(() => null);
    const serverIcon = guild.iconURL({ extension: "png", size: 256 }) ?? null;

    if (msg) {
      const winnersText =
        winners.length > 0
          ? winners.map((id) => `<@${id}>`).join(", ")
          : "No winners (no entries)";

      const endedEmbed = new EmbedBuilder()
        .setTitle("🎉 GIVEAWAY ENDED 🎉")
        .setDescription(
          `**Prize:** ${giveaway.prize}\n` +
          `**Winners:** ${winnersText}\n` +
          `**Hosted By:** <@${giveaway.hostedBy}>\n` +
          `**Ended:** <t:${Math.floor(Date.now() / 1000)}:R>`
        )
        .setColor(0x2f3136)
        .setThumbnail(serverIcon)
        .setTimestamp();

      await msg.edit({ embeds: [endedEmbed], components: [] });
    }

    if (winners.length > 0) {
      await ch.send(
        `🎉 Congratulations ${winners.map((id) => `<@${id}>`).join(", ")}! ` +
        `You won **${giveaway.prize}**!`
      );
    } else {
      await ch.send(`⚠️ The giveaway for **${giveaway.prize}** ended with no entries.`);
    }
  } catch (err) {
    console.error("[Giveaway] Failed to end giveaway:", giveawayId, err);
  }

  return winners;
}

/**
 * Start the giveaway scheduler.
 * Polls the database every 15 seconds for expired, unended giveaways.
 */
export function startGiveawayScheduler(client: Client): void {
  const POLL_INTERVAL_MS = 15_000;

  const poll = async () => {
    try {
      const expired = await prisma.giveaway.findMany({
        where: {
          ended: false,
          endsAt: { lte: new Date() }
        }
      });

      for (const g of expired) {
        await endGiveaway(g.id, client);
      }
    } catch (err) {
      console.error("[Giveaway] Scheduler error:", err);
    }
  };

  // Run immediately on startup to catch any missed giveaways (e.g. bot was down)
  poll();
  setInterval(poll, POLL_INTERVAL_MS);
  console.log("[Giveaway] Scheduler started (polling every 15s).");
}
