import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listinvoiceCommand: Command = {
  name: "listinvoice",
  aliases: ["list invoice"],
  description: "List invoices (placeholder/OAuth2 restricted).",
  category: "General Commands",
  usage: "listinvoice",
  examples: ["listinvoice"],
  execute: async (ctx) => {
    const embed = UniversalEmbed.neutral("Invoice List", ctx.guild)
      .setDescription("This database filter is currently not syncable.");
    return ctx.reply({ embeds: [embed] });
  }
};
