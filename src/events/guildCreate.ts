import { Guild, TextChannel, PermissionFlagsBits, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { UniversalEmbed } from "../services/embed.js";

export async function handleGuildCreate(guild: Guild) {
  let targetChannel: TextChannel | null = null;

  // 1. Try system channel first
  if (guild.systemChannel && guild.members.me && guild.systemChannel.permissionsFor(guild.members.me).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])) {
    targetChannel = guild.systemChannel as TextChannel;
  } else {
    // 2. Fall back to the first text channel where the bot has send & embed permissions
    const textChannels = guild.channels.cache.filter(
      c => c.type === ChannelType.GuildText && guild.members.me !== null &&
      c.permissionsFor(guild.members.me).has([PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks])
    );
    targetChannel = textChannels.first() as TextChannel || null;
  }

  if (!targetChannel) return;

  const clientUser = guild.client.user;
  const avatarUrl = clientUser?.displayAvatarURL({ extension: "png", size: 1024 }) || null;

  // 3. Build the embed with bot avatar thumbnail and no footer
  const embed = new UniversalEmbed("success", undefined, guild)
    .setThumbnail(avatarUrl)
    .setDescription(
      `• **Thanks for adding !**\n\n` +
      `• My default prefix is \`-\`\n` +
      `• Use \`-help\` or \`/help\` in the server for commands\n` +
      `• For questions or details join [Support server](https://discord.gg/gupshup)`
    );

  // 4. Build Link buttons
  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setLabel("Support Server")
      .setURL("https://discord.gg/gupshup")
      .setStyle(ButtonStyle.Link),
    new ButtonBuilder()
      .setLabel("Website")
      .setURL("https://discord.gg/gupshup")
      .setStyle(ButtonStyle.Link)
  );

  try {
    await targetChannel.send({ embeds: [embed], components: [buttonsRow] });
  } catch (err) {
    console.error(`⚠️ Failed to send guild join welcome message in guild ${guild.id}:`, err);
  }
}
