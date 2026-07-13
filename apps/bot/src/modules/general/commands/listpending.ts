import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listpendingCommand: Command = {
  name: "listpending",
  aliases: ["list pending"],
  description: "List all members who have not accepted the server rules (Rules Gate).",
  category: "General Commands",
  usage: "listpending",
  examples: ["listpending"],
  execute: async (ctx: any) => {
    const pending = ctx.guild.members.cache.filter((m: any) => m.pending);
    const description = pending.map((m: any) => `• **${m.user.tag}** (${m.id})`).slice(0, 30).join("\n") || "No pending members.";

    const embed = UniversalEmbed.neutral("Pending Members", ctx.guild)
      .setDescription(description);

    return ctx.reply({ embeds: [embed] });
  }
};

