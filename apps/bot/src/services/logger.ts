import { Guild, EmbedBuilder, ChannelType, TextChannel, ActionRowBuilder, StringSelectMenuBuilder } from "discord.js";
import { prisma } from "./db.js";

export type LogCategory =
  | "channels"
  | "automod"
  | "emojis"
  | "invites"
  | "messages"
  | "roles"
  | "server"
  | "users"
  | "voice"
  | "moderation";

export const LOG_CATEGORIES: LogCategory[] = [
  "channels",
  "automod",
  "emojis",
  "invites",
  "messages",
  "roles",
  "server",
  "users",
  "voice",
  "moderation"
];

export function resolveLogCategory(input: string): LogCategory | null {
  const clean = input.toLowerCase().trim();
  if (["message", "messages", "msg", "msgs"].includes(clean)) return "messages";
  if (["invite", "invites", "inv", "invs"].includes(clean)) return "invites";
  if (["user", "users", "member", "members", "join", "leave"].includes(clean)) return "users";
  if (["voice", "vc", "vcs"].includes(clean)) return "voice";
  if (["channel", "channels", "chan", "chans", "thread", "threads"].includes(clean)) return "channels";
  if (["role", "roles"].includes(clean)) return "roles";
  if (["moderation", "mod", "mods", "ban", "kick", "timeout", "warn"].includes(clean)) return "moderation";
  if (["automod", "auto-mod", "auto"].includes(clean)) return "automod";
  if (["emoji", "emojis", "sticker", "stickers"].includes(clean)) return "emojis";
  if (["server", "guild", "settings"].includes(clean)) return "server";
  return null;
}

export async function sendGuildLog(
  guild: Guild,
  category: LogCategory,
  embed: EmbedBuilder
): Promise<void> {
  try {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: guild.id }
    });
    if (!config || !config.logEnabled) return;

    // Parse logToggles JSON
    const logData = (config.logToggles as any) || {};
    const toggles = logData.toggles || {};
    const channels = logData.channels || {};

    // Categories are enabled by default unless explicitly set to false
    if (toggles[category] === false) return;

    const targetChannelId = channels[category] || config.logChannelId;
    if (!targetChannelId) return;

    const channel = guild.channels.cache.get(targetChannelId) || 
      (await guild.channels.fetch(targetChannelId).catch(() => null));

    if (channel && channel.type === ChannelType.GuildText) {
      await (channel as TextChannel).send({ embeds: [embed] }).catch(() => null);
    }
  } catch (error) {
    console.error(`Failed to send guild log for category ${category}:`, error);
  }
}

export async function getLoggingConfigPayload(guild: Guild) {
  const config = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
  const logData = (config?.logToggles as any) || {};
  const toggles = logData.toggles || {};
  const channels = logData.channels || {};

  const embed = new EmbedBuilder()
    .setColor(0x3498db)
    .setTitle("🛡️ Guild Logging Configurations")
    .setDescription(
      `Configure which logs go to which channels. Use the dropdown below to select a category and bind a channel.`
    )
    .addFields(
      { name: "Global Enabled", value: config?.logEnabled ? "✅ Yes" : "❌ No", inline: true },
      { name: "Global Log Channel", value: config?.logChannelId ? `<#${config.logChannelId}>` : "Not Configured", inline: true }
    );

  const listStr = LOG_CATEGORIES.map(cat => {
    const isEnabled = toggles[cat] !== false;
    const customChannel = channels[cat] ? `<#${channels[cat]}>` : "*Global Channel*";
    return `• **${cat}**: ${isEnabled ? "✅ Enabled" : "❌ Disabled"} | ${customChannel}`;
  }).join("\n");

  embed.addFields({ name: "Category Channels:", value: listStr });

  // String Select Menu component for picking category
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("logging_config_pick_category")
    .setPlaceholder("Select a category to customize channel...")
    .addOptions(
      LOG_CATEGORIES.map(cat => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: cat,
        description: `Set channel or toggle logs for ${cat}.`
      }))
    );

  const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

  return { embeds: [embed], components: [row] };
}
