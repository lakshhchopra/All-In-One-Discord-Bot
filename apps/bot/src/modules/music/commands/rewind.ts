import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const rewindCommand: Command = {
  name: "rewind",
  aliases: ["rw"],
  description: "Rewind the current song by a given number of seconds.",
  category: "Music",
    usage: "rewind <seconds>",
  examples: ["rewind 10"],
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.isPlaying()) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }

    const secs = parseInt(ctx.args[0] ?? "10", 10);
    if (isNaN(secs) || secs <= 0) return ctx.wrongUsage(rewindCommand);

    const currentStreamTime = queue.node.streamTime;
    const target = Math.max(0, currentStreamTime - (secs * 1000));
    await queue.node.seek(target);
    
    return ctx.reply({ embeds: [UniversalEmbed.success(`⏪ Rewound by **${secs}** seconds.`, ctx.guild)] });
  }
};

