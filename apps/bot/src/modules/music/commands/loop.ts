import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";
import { QueueRepeatMode } from "discord-player";

export const loopCommand: Command = {
  name: "loop",
  aliases: ["repeat"],
  description: "Toggle loop mode (Off, Track, Queue).",
  category: "Music",
    usage: "loop <off | track | queue>",
  examples: ["loop track", "loop queue"],
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.isPlaying()) {
      return ctx.reply({ embeds: [UniversalEmbed.error("There is no music playing right now.", ctx.guild)] }, 5);
    }

    const modeStr = ctx.args[0]?.toLowerCase();
    let mode: any = QueueRepeatMode.OFF;
    let modeText = "Off";

    if (modeStr === "track" || modeStr === "song") {
      mode = QueueRepeatMode.TRACK;
      modeText = "Track";
    } else if (modeStr === "queue" || modeStr === "all") {
      mode = QueueRepeatMode.QUEUE;
      modeText = "Queue";
    } else if (modeStr !== "off") {
      return ctx.wrongUsage(loopCommand);
    }

    queue.setRepeatMode(mode);
    return ctx.reply({ embeds: [UniversalEmbed.success(`🔁 Loop mode set to: **${modeText}**.`, ctx.guild)] });
  }
};

