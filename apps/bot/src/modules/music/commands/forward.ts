import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const forwardCommand: Command = {
  name: "forward",
  aliases: ["ff"],
  description: "Fast forward the current song by a given number of seconds.",
  category: "Music",
    usage: "forward <seconds>",
  examples: ["forward 10"],
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.isPlaying()) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }

    const secs = parseInt(ctx.args[0] ?? "10", 10);
    if (isNaN(secs) || secs <= 0) return ctx.wrongUsage(forwardCommand);

    const currentStreamTime = queue.node.streamTime;
    await queue.node.seek(currentStreamTime + (secs * 1000));
    
    return ctx.reply({ embeds: [UniversalEmbed.success(`⏩ Fast forwarded by **${secs}** seconds.`, ctx.guild)] });
  }
};

