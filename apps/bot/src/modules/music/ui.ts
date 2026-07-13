import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors } from "discord.js";
import { Track, GuildQueue } from "discord-player";


export function buildNowPlayingPayload(queue: GuildQueue, track: Track) {
  const embed = new EmbedBuilder()
    .setColor("#1DB954") // Spotify Green for premium feel
    .setAuthor({ name: "Now Playing", iconURL: "https://cdn-icons-png.flaticon.com/512/3844/3844724.png" })
    .setDescription(`**[${track.title}](${track.url})**\n*by ${track.author}*`)
    .addFields(
      { name: "Duration", value: `\`${track.duration}\``, inline: true },
      { name: "Requested by", value: track.requestedBy ? track.requestedBy.toString() : "Unknown", inline: true }
    );
    
  // Instead of a massive image or tiny thumbnail, we leave it clean. 
  // If they ever want it back, we can use setImage() for a cinematic banner.

  const isPausedBtn = !queue.isPlaying();

  const pauseBtn = new ButtonBuilder()
    .setCustomId("music_pause")
    .setLabel(isPausedBtn ? "Resume" : "Pause")
    .setStyle(isPausedBtn ? ButtonStyle.Success : ButtonStyle.Secondary)
    .setEmoji(isPausedBtn ? "▶️" : "⏸️");

  const skipBtn = new ButtonBuilder()
    .setCustomId("music_skip")
    .setLabel("Skip")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("⏭️");

  const stopBtn = new ButtonBuilder()
    .setCustomId("music_stop")
    .setLabel("Stop")
    .setStyle(ButtonStyle.Danger)
    .setEmoji("⏹️");

  const loopBtn = new ButtonBuilder()
    .setCustomId("music_loop")
    .setLabel("Loop")
    .setStyle(queue.repeatMode === 0 ? ButtonStyle.Secondary : ButtonStyle.Primary)
    .setEmoji("🔁");

  const refreshBtn = new ButtonBuilder()
    .setCustomId("music_refresh")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("🔄");

  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(pauseBtn, skipBtn, stopBtn, loopBtn, refreshBtn);

  const volDownBtn = new ButtonBuilder()
    .setCustomId("music_voldown")
    .setLabel("Vol -")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("🔉");

  const volUpBtn = new ButtonBuilder()
    .setCustomId("music_volup")
    .setLabel("Vol +")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("🔊");

  const queueBtn = new ButtonBuilder()
    .setCustomId("music_queue")
    .setLabel("Queue")
    .setStyle(ButtonStyle.Secondary)
    .setEmoji("📋");

  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(volDownBtn, volUpBtn, queueBtn);

  return { embeds: [embed], components: [row1, row2] };
}
