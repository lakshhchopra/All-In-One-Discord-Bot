import { Interaction, ButtonInteraction } from "discord.js";
import { getPlayer } from "../../services/music.js";
import { UniversalEmbed } from "../../services/embed.js";
import { QueueRepeatMode } from "discord-player";
import { buildNowPlayingPayload } from "./ui.js";

export async function handleMusicInteraction(interaction: ButtonInteraction) {
  if (!interaction.customId.startsWith("music_") || !interaction.guild) return;

  await interaction.deferUpdate().catch(() => null);

  const player = getPlayer();
  const queue = player.nodes.get(interaction.guild.id);

  if (!queue) {
    return interaction.followUp({
      embeds: [UniversalEmbed.error("There is no music playing right now.", interaction.guild)],
      ephemeral: true
    }).catch(() => null);
  }

  const voiceChannel = (interaction.member as any)?.voice?.channel;
  if (!voiceChannel || voiceChannel.id !== queue.channel?.id) {
    return interaction.followUp({
      embeds: [UniversalEmbed.error("You must be in the same voice channel to use these buttons.", interaction.guild)],
      ephemeral: true
    }).catch(() => null);
  }

  const action = interaction.customId.split("_")[1];

  try {
    if (action === "pause") {
      const isPaused = !queue.isPlaying();
      if (isPaused) {
        queue.node.resume();
      } else {
        queue.node.pause();
      }
    } else if (action === "skip") {
      queue.node.skip();
    } else if (action === "stop") {
      queue.delete();
      return interaction.message.delete().catch(() => null);
    } else if (action === "loop") {
      // Toggle between OFF and TRACK and QUEUE
      if (queue.repeatMode === QueueRepeatMode.OFF) {
        queue.setRepeatMode(QueueRepeatMode.TRACK);
      } else if (queue.repeatMode === QueueRepeatMode.TRACK) {
        queue.setRepeatMode(QueueRepeatMode.QUEUE);
      } else {
        queue.setRepeatMode(QueueRepeatMode.OFF);
      }
    } else if (action === "voldown") {
      const current = queue.node.volume;
      const target = Math.max(0, current - 10);
      queue.node.setVolume(target);
      return interaction.followUp({ content: `🔉 Volume set to **${target}%**`, ephemeral: true }).catch(() => null);
    } else if (action === "volup") {
      const current = queue.node.volume;
      const target = Math.min(200, current + 10);
      queue.node.setVolume(target);
      return interaction.followUp({ content: `🔊 Volume set to **${target}%**`, ephemeral: true }).catch(() => null);
    } else if (action === "queue") {
      if (!queue.tracks.size) {
        return interaction.followUp({ content: "The queue is completely empty.", ephemeral: true }).catch(() => null);
      }
      
      const current = queue.currentTrack;
      const tracks = queue.tracks.toArray();

      const embed = new UniversalEmbed("info")
        .setTitle("🎶 Current Queue")
        .setDescription(`**Now Playing:** [${current?.title}](${current?.url})\n\n` + 
          tracks.slice(0, 10).map((t, i) => `**${i + 1}.** [${t.title}](${t.url}) - ${t.duration}`).join("\n"));

      if (tracks.length > 10) {
        embed.setFooter({ text: `And ${tracks.length - 10} more...` });
      }

      return interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => null);
    } else if (action === "refresh") {
      // Just refreshes the UI payload below
    }

    // Refresh UI
    if (queue.currentTrack) {
      const payload = buildNowPlayingPayload(queue, queue.currentTrack);
      await interaction.message.edit(payload).catch(() => null);
    }
  } catch (e) {
    console.error("[Music Interaction Error]", e);
  }
}
