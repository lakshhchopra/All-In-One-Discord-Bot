import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const stopCommand: Command = {
  name: "stop",
  aliases: ["leave", "dc"],
  description: "Stop the music and clear the queue.",
  category: "Music",
    usage: "stop",
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.isPlaying()) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }
    
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== queue.channel?.id) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in the same voice channel to stop the music.", ctx.guild)] }, 5);
    }

    queue.delete();
    return ctx.reply({ embeds: [UniversalEmbed.success("⏹️ Stopped the music and cleared the queue.", ctx.guild)] });
  }
};

