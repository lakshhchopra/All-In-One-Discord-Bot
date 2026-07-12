import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const joinedatCommand: Command = {
  name: "joinedat",
  description: "View when a member joined the server, or list oldest server joins.",
  category: "General Commands",
  usage: "joinedat [member]",
  examples: ["joinedat", "joinedat @member"],
  execute: async (ctx: any) => {
    const member = ctx.getMemberOption("member", 0);

    if (member) {
      const timestamp = Math.floor((member.joinedTimestamp || 0) / 1000);
      const embed = UniversalEmbed.neutral(`Join Date for ${member.user.tag}`, ctx.guild)
        .setDescription(`📅 **Joined Server:** <t:${timestamp}:F> (<t:${timestamp}:R>)`);
      return ctx.reply({ embeds: [embed] });
    }

    // Default: List oldest members
    const sorted = [...ctx.guild.members.cache.values()]
      .sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0))
      .slice(0, 15);

    const description = sorted
      .map((m, idx) => `${idx + 1}. **${m.user.tag}** (Joined <t:${Math.floor((m.joinedTimestamp || 0) / 1000)}:D>)`)
      .join("\n");

    const embed = UniversalEmbed.neutral("Oldest Server Joins", ctx.guild)
      .setDescription(description);

    return ctx.reply({ embeds: [embed] });
  }
};

