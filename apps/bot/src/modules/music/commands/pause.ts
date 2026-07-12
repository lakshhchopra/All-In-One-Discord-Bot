import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const pauseCommand: Command = {
  name: "pause",
  description: "Pause the currently playing track.",
  category: "Music",
    usage: "pause",
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.isPlaying()) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }
    
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== queue.channel?.id) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in the same voice channel to use this command.", ctx.guild)] }, 5);
    }

    queue.node.pause();
    return ctx.reply({ embeds: [UniversalEmbed.success("⏸️ Paused the music.", ctx.guild)] });
  }
};

