import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { getPlayer } from "../../../services/music.js";

export const queueCommand: Command = {
  name: "queue",
  aliases: ["q"],
  description: "Display the current music queue.",
  category: "Music",
    usage: "queue",
  execute: async (ctx: any) => {
    const player = getPlayer();
    const queue = player.nodes.get(ctx.guild.id);
    
    if (!queue || !queue.tracks.size) {
      return ctx.reply({ embeds: [UniversalEmbed.error("The queue is completely empty.", ctx.guild)] }, 5);
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

    return ctx.reply({ embeds: [embed] });
  }
};

