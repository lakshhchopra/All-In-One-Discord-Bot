import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listbansCommand: Command = {
  name: "listbans",
  aliases: ["list bans"],
  description: "List all banned users in the server.",
  category: "General Commands",
  usage: "listbans",
  examples: ["listbans"],
  execute: async (ctx: any) => {
    try {
      const bans = await ctx.guild.bans.fetch({ limit: 20 });
      const str = bans.map((b: any) => `• **${b.user.tag}** (${b.user.id})`).join("\n") || "No banned users.";

      const embed = UniversalEmbed.neutral("Banned Users", ctx.guild)
        .setDescription(str);
      return ctx.reply({ embeds: [embed] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("I do not have permission to fetch bans.", ctx.guild)] }, 5);
    }
  }
};

