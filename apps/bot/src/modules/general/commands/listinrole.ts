import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const listinroleCommand: Command = {
  name: "listinrole",
  aliases: ["list inrole", "inrole"],
  description: "List all members holding a specific role.",
  category: "General Commands",
  usage: "listinrole <@role>",
  examples: ["listinrole @VIP"],
  execute: async (ctx: any) => {
    const role = ctx.getRoleOption("role", 0) || (ctx.isInteraction ? null : (ctx.source as any).mentions?.roles?.first());
    if (!role) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to list members of.", ctx.guild)] }, 5);
    }

    const members = ctx.guild.members.cache.filter((m: any) => m.roles.cache.has(role.id));
    const description = members.map((m: any) => `• **${m.user.tag}** (${m.id})`).slice(0, 30).join("\n") || "No members have this role.";

    const embed = UniversalEmbed.neutral(`Members in role: ${role.name}`, ctx.guild)
      .setDescription(description)
      .setFooter({ text: `Showing up to 30 of ${members.size} member(s)` });

    return ctx.reply({ embeds: [embed] });
  }
};

