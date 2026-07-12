import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { ChannelType } from "discord.js";

export const ticketlistCommand: Command = {
  name: "ticketlist",
  aliases: ["ticket list"],
  description: "List all open support tickets.",
  category: "Ticket",
  permissionLevel: "MODERATOR",
  usage: "ticket list",
  execute: async (ctx: any) => {
    const channels = ctx.guild.channels.cache.filter((c: any) => c.name.startsWith("ticket-") && c.type === ChannelType.GuildText);
    const listStr = channels.map((c: any) => `• <#${c.id}>`).join("\n") || "No open tickets.";
    return ctx.reply({
      embeds: [
        UniversalEmbed.info("Open Support Tickets", ctx.guild)
          .setDescription(listStr)
      ]
    });
  }
};

