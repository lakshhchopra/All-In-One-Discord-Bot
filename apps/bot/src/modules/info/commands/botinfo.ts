import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { version as djsVersion } from "discord.js";

export const botinfoCommand: Command = {
  name: "botinfo",
  description: "Get bot technical specifications.",
  category: "Information",
  usage: "botinfo",
  examples: ["botinfo"],
  execute: async (ctx) => {
    const uptime = Math.floor(ctx.guild.client.uptime! / 1000);
    const serverCount = ctx.guild.client.guilds.cache.size;

    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = UniversalEmbed.info("Technical Specifications", ctx.guild)
      .addFields(
        { name: "Servers", value: `\`${serverCount}\``, inline: true },
        { name: "Node Version", value: `\`${process.version}\``, inline: true },
        { name: "Discord.js", value: `\`v${djsVersion}\``, inline: true },
        { name: "Uptime", value: `\`${days}d ${hours}h ${minutes}m\``, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  }
};
