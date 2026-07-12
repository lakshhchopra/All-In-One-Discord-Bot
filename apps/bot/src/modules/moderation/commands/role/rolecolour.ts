import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const rolecolourCommand: Command = {
  name: "rolecolour",
  aliases: ["role colour", "role color", "rolecolor"],
  description: "Change the color of a specified role.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "role colour <@role> <#hexcolor>",
  examples: ["role colour @VIP #FF5733"],
  execute: async (ctx: any) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    let role = ctx.getRoleOption("role", 0);
    let colorArg = ctx.args[1];

    if (!role && (ctx.args[0]?.toLowerCase() === "colour" || ctx.args[0]?.toLowerCase() === "color")) {
      role = ctx.getRoleOption("role", 1);
      colorArg = ctx.args[2];
    }

    if (!role || !colorArg) return ctx.wrongUsage(rolecolourCommand);

    if (!colorArg.match(/^#[0-9A-Fa-f]{6}$/)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid hex color. Example: `#FF5733`", ctx.guild)] }, 5);
    }

    const colorInt = parseInt(colorArg.slice(1), 16);

    try {
      await (role as any).setColor(colorInt, `Color set by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🎨 Set **${role.name}** color to \`${colorArg}\`.`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error(`Could not set color. Make sure my role is higher than the target role.`, ctx.guild)] }, 5);
    }
  }
};

