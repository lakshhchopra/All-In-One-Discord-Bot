import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const skipCommand: Command = {
  name: "skip",
  aliases: ["s", "next"],
  description: "Skip the currently playing track.",
  category: "Music",
    usage: "skip",
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.isPlaying()) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }
    
    const voiceChannel = ctx.member.voice.channel;
    if (!voiceChannel || voiceChannel.id !== queue.channel?.id) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You must be in the same voice channel to skip.", ctx.guild)] }, 5);
    }

    queue.node.skip();
    return ctx.reply({ embeds: [UniversalEmbed.success("⏭️ Skipped the current track.", ctx.guild)] });
  }
};

