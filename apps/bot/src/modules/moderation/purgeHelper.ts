import { TextChannel, Message, Collection, Snowflake } from "discord.js";

/**
 * Fetch up to `limit` messages and bulk-delete those matching the filter.
 * Returns count of deleted messages.
 */
export async function bulkDeleteFiltered(
  channel: TextChannel,
  limit: number,
  filter: (msg: Message) => boolean
): Promise<number> {
  const fetched = await channel.messages.fetch({ limit: Math.min(limit, 100) });
  const toDelete = fetched.filter(filter);
  if (toDelete.size === 0) return 0;
  const deleted = await channel.bulkDelete(toDelete, true); // true = skip messages > 14 days
  return deleted.size;
}

export function getTextChannel(channel: any): TextChannel | null {
  if (channel && "bulkDelete" in channel) return channel as TextChannel;
  return null;
}
