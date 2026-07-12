import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const roleiconCommand: Command = {
  name: "roleicon",
  description: "Set or change the icon of a role.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "roleicon <role> <url | custom_emoji>",
  examples: ["roleicon @Member <:gp_shield:1524143216222535891>", "roleicon @Member https://example.com/icon.png"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    const role = ctx.getRoleOption("role", 0);
    const target = ctx.args[1];
    if (!role || !target) return ctx.wrongUsage(roleiconCommand);

    let icon: string | null = null;
    const emojiMatch = target.match(/<a?:[a-zA-Z0-9_]+:([0-9]+)>/);
    if (emojiMatch) {
      icon = `https://cdn.discordapp.com/emojis/${emojiMatch[1]}.png`;
    } else if (target.startsWith("http://") || target.startsWith("https://")) {
      icon = target;
    }

    if (!icon) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a valid URL or custom emoji.", ctx.guild)] }, 5);

    try {
      await (role as any).setIcon(icon);
      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully updated icon for role **${role.name}**`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to set role icon. Ensure the server is boosted to Level 2 and the bot has Manage Roles permission.", ctx.guild)] }, 5);
    }
  }
};
