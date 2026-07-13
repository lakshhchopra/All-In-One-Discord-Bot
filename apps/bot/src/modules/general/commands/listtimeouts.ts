import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listtimeoutsCommand: Command = {
  name: "listtimeouts",
  aliases: ["list timeouts"],
  description: "List all members currently timed out in the server.",
  category: "General Commands",
  usage: "listtimeouts",
  examples: ["listtimeouts"],
  execute: async (ctx: any) => {
    const timeouts = ctx.guild.members.cache.filter(
      (m: any) => m.communicationDisabledUntilTimestamp !== null && m.communicationDisabledUntilTimestamp > Date.now()
    );
    const description = timeouts
      .map((m: any) => `• **${m.user.tag}** (Until <t:${Math.floor(m.communicationDisabledUntilTimestamp! / 1000)}:R>)`)
      .slice(0, 30)
      .join("\n") || "No members currently timed out.";

    const embed = UniversalEmbed.neutral("Timed-out Members", ctx.guild)
      .setDescription(description);

    return ctx.reply({ embeds: [embed] });
  }
};

