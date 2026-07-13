import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listchannelsCommand: Command = {
  name: "listchannels",
  aliases: ["list channels"],
  description: "List all channels in this server.",
  category: "General Commands",
  usage: "listchannels",
  examples: ["listchannels"],
  execute: async (ctx: any) => {
    const channels = ctx.guild.channels.cache.map((c: any) => `• **${c.name}** (${c.id}) - <#${c.id}>`).slice(0, 25).join("\n") +
      (ctx.guild.channels.cache.size > 25 ? "\n... and more" : "");

    const embed = UniversalEmbed.neutral("Server Channels", ctx.guild)
      .setDescription(channels)
      .setFooter({ text: `Total Channels: ${ctx.guild.channels.cache.size}` });

    return ctx.reply({ embeds: [embed] });
  }
};

