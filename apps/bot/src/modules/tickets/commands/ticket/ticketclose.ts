import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const ticketcloseCommand: Command = {
  name: "ticketclose",
  aliases: ["ticket close"],
  description: "Close and delete the current support ticket.",
  category: "Ticket",
  usage: "ticket close",
  execute: async (ctx: any) => {
    const isTicketChannel = (ctx.channel as any).name?.startsWith("ticket-");
    if (!isTicketChannel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This command can only be executed inside a ticket channel.", ctx.guild)] }, 5);
    }

    await ctx.reply("🔒 Closing ticket and deleting this channel in **5 seconds**...");

    setTimeout(async () => {
      try {
        await ctx.channel.delete();
      } catch {}
    }, 5000);
  }
};

