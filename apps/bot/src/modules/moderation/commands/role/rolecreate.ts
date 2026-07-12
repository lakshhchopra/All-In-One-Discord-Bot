import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const rolecreateCommand: Command = {
  name: "rolecreate",
  aliases: ["role create"],
  description: "Create a new server role with an optional color.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "rolecreate <name> [#hexcolor]",
  examples: ["rolecreate VIP #FFD700", "rolecreate Muted"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need the **Manage Roles** permission.", ctx.guild)] }, 5);
    }
    const name = ctx.args[0];
    if (!name) return ctx.wrongUsage(rolecreateCommand);

    const colorArg = ctx.args[1];
    const color = colorArg?.match(/^#[0-9A-Fa-f]{6}$/) ? parseInt(colorArg.slice(1), 16) : undefined;

    try {
      const role = await ctx.guild.roles.create({ name, color, reason: `Created by ${ctx.user.tag}` });
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Created role **${role.name}** (ID: \`${role.id}\`)${color ? ` with color \`${colorArg}\`` : ""}.`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to create role.", ctx.guild)] }, 5);
    }
  }
};
