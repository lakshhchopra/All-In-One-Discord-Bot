import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const pingCommand: Command = {
  name: "ping",
  description: "Check bot latency.",
  category: "Information",
  usage: "ping",
  examples: ["ping"],
  execute: async (ctx) => {
    const start = Date.now();
    const replyMsg = await ctx.reply("Calculating ping...");
    const latency = Date.now() - start;
    const wsPing = ctx.guild.client.ws.ping;

    const embed = UniversalEmbed.info("Bot Latency", ctx.guild)
      .addFields(
        { name: "Message Latency", value: `\`${latency}ms\``, inline: true },
        { name: "API Websocket Latency", value: `\`${wsPing}ms\``, inline: true }
      );

    if (ctx.isInteraction) {
      await ctx.reply({ embeds: [embed] });
    } else {
      await replyMsg?.edit({ content: "", embeds: [embed] });
    }
  }
};
