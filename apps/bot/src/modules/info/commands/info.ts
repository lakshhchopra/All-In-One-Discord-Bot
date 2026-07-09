import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { Message } from "discord.js";

export const infoCommand: Command = {
  name: "info",
  description: "Displays bot statistics, ping status, developer details, or status.",
  category: "Bot Info",
  aliases: ["ping", "status", "botinfo", "aboutdev"],
  execute: async (ctx) => {
    const cmd = ctx.commandName.toLowerCase();

    if (cmd === "ping") {
      const sent = await ctx.reply("Calculating ping...");
      const sourceCreated = ctx.isInteraction
        ? (ctx.source as any).createdTimestamp
        : (ctx.source as Message).createdTimestamp;
      const latency = sent ? sent.createdTimestamp - sourceCreated : -1;
      const ws = ctx.client.ws.ping;
      const embed = UniversalEmbed.success(
        `🛰️ **Pong!**\n` +
        `• **API Latency:** \`${latency}ms\`\n` +
        `• **Websocket Heartbeat:** \`${ws}ms\``,
        ctx.guild
      );
      return sent?.edit({ content: "", embeds: [embed] });
    }

    if (cmd === "status" || cmd === "botinfo" || cmd === "info") {
      const uptime = Math.floor(ctx.client.uptime! / 1000);
      const uptimeStr = `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`;
      const servers = ctx.client.guilds.cache.size;
      const members = ctx.client.guilds.cache.reduce((a: number, g) => a + g.memberCount, 0);

      const embed = UniversalEmbed.info("🤖 Bot Status & Statistics", ctx.guild)
        .addFields(
          { name: "Bot Name", value: ctx.client.user?.username || "Gupshup", inline: true },
          { name: "Uptime", value: uptimeStr, inline: true },
          { name: "Servers", value: String(servers), inline: true },
          { name: "Total Users", value: String(members), inline: true },
          { name: "Discord.js", value: "v14.11.0", inline: true },
          { name: "Node.js", value: process.version, inline: true }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (cmd === "aboutdev") {
      const embed = UniversalEmbed.info("💻 About Developer", ctx.guild)
        .setDescription(
          `• **Lead Developer:** _.lakshh\n` +
          `• **Support Server:** [Join Support Server](https://discord.gg/gupshup)\n` +
          `• **Built Using:** TypeScript, Node.js, and Discord.js v14`
        );
      return ctx.reply({ embeds: [embed] });
    }
  }
};
