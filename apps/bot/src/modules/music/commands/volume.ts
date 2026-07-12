import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const volumeCommand: Command = {
  name: "volume",
  aliases: ["vol", "v"],
  description: "Adjust the music volume.",
  category: "Music",
    usage: "volume <1-200>",
  examples: ["volume 50"],
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.isPlaying()) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }

    if (!ctx.args[0]) {
      return ctx.reply({ embeds: [UniversalEmbed.info(`🔊 Current volume is **${queue.node.volume}%**.`, ctx.guild)] });
    }

    const vol = parseInt(ctx.args[0], 10);
    if (isNaN(vol) || vol < 1 || vol > 200) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a valid volume between 1 and 200.", ctx.guild)] }, 5);
    }

    queue.node.setVolume(vol);
    return ctx.reply({ embeds: [UniversalEmbed.success(`🔊 Volume set to **${vol}%**.`, ctx.guild)] });
  }
};

