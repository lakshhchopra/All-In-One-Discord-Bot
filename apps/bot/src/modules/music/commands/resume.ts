import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const resumeCommand: Command = {
  name: "resume",
  aliases: ["unpause"],
  description: "Resume the currently paused track.",
  category: "Music",
    usage: "resume",
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.currentTrack) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music in the queue right now.", ctx.guild)] }, 5);
    }
    
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== queue.channel?.id) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in the same voice channel to use this command.", ctx.guild)] }, 5);
    }

    queue.node.resume();
    return ctx.reply({ embeds: [UniversalEmbed.success("▶️ Resumed the music.", ctx.guild)] });
  }
};

