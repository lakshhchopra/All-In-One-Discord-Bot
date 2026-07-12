import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const uptimeCommand: Command = {
  name: "uptime",
  description: "View the bot's current uptime.",
  category: "Bot Info",
  permissionLevel: "EVERYONE",
  usage: "uptime",
  examples: ["uptime"],
  execute: async (ctx: any) => {
    const uptimeSeconds = Math.floor(process.uptime());
    
    const days = Math.floor(uptimeSeconds / 86400);
    const hours = Math.floor((uptimeSeconds % 86400) / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    const seconds = uptimeSeconds % 60;
    
    const timeParts = [];
    if (days > 0) timeParts.push(`${days}d`);
    if (hours > 0) timeParts.push(`${hours}h`);
    if (minutes > 0) timeParts.push(`${minutes}m`);
    timeParts.push(`${seconds}s`);
    
    const uptimeStr = timeParts.join(" ");
    
    const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
      .setTitle("Bot Uptime")
      .setDescription(`The bot has been online for: **${uptimeStr}**`);
    
    return ctx.reply({ embeds: [embed] });
  }
};

