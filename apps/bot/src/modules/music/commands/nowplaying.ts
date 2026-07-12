import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";
import { buildNowPlayingPayload } from "../ui.js";

export const nowplayingCommand: Command = {
  name: "nowplaying",
  aliases: ["np"],
  description: "Show the currently playing song.",
  category: "Music",
    usage: "nowplaying",
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.currentTrack) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }

    const payload = buildNowPlayingPayload(queue, queue.currentTrack);
    return ctx.reply(payload);
  }
};

