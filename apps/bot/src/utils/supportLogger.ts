import { Client, EmbedBuilder, ChannelType, TextChannel, Guild } from "discord.js";
import { config } from "../config/index.js";

type LogType = "command" | "server" | "security";

const CHANNEL_NAMES: Record<LogType, string> = {
  command: "command-logs",
  server: "server-logs",
  security: "security-logs"
};

async function getSupportGuild(client: Client): Promise<Guild | null> {
  const guildId = config.SUPPORT_GUILD_ID;
  if (guildId) {
    try {
      return await client.guilds.fetch(guildId);
    } catch {
      // Ignore and fallback to search
    }
  }

  // Fallback: search for any guild matching Support or TeamX
  return client.guilds.cache.find(g => 
    g.name.toLowerCase().includes("support") || 
    g.name.toLowerCase().includes("teamx")
  ) || null;
}

export async function sendSupportLog(
  client: Client,
  type: LogType,
  embed: EmbedBuilder
): Promise<void> {
  try {
    const guild = await getSupportGuild(client);
    if (!guild) return;

    const channelName = CHANNEL_NAMES[type];
    let channel = guild.channels.cache.find(c => 
      c.name === channelName && c.type === ChannelType.GuildText
    ) as TextChannel | undefined;

    if (!channel) {
      // Try fetching all channels first
      const fetched = await guild.channels.fetch();
      channel = fetched.find(c => 
        c && c.name === channelName && c.type === ChannelType.GuildText
      ) as TextChannel | undefined;
    }

    if (!channel) {
      // Automatically create it
      channel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        reason: "Automatic bot logging channel setup"
      });
    }

    await channel.send({ embeds: [embed] });
  } catch (error) {
    console.error(`Failed to send support log for type ${type}:`, error);
  }
}
