import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const ticketinfoCommand: Command = {
  name: "ticketinfo",
  aliases: ["ticket reopen", "ticket transcript", "ticket greetmsg", "ticket category", "ticket type", "ticket autotranscript", "ticket logging", "ticket maxtickets"],
  description: "View the ticket system configuration settings.",
  category: "Ticket",
  permissionLevel: "ADMIN",
  usage: "ticket <reopen|transcript|logging|...>",
  execute: async (ctx: any) => {
    return ctx.reply({
      embeds: [
        UniversalEmbed.info("Ticket System Settings Info", ctx.guild)
          .setDescription(
            `- **Logging:** Enabled (logged to support server)\n` +
            `- **Transcripts:** Auto-saved\n` +
            `- **Max Tickets:** Unlimited\n` +
            `- **Category:** 🎫 Tickets`
          )
      ]
    });
  }
};

