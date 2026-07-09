import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const roleaddCommand: Command = {
  name: "roleadd",
  aliases: ["role add"],
  description: "Add a role to a member.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "roleadd <@member> <@role>",
  examples: ["roleadd @member @VIP", "roleadd @member @Admin"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need the **Manage Roles** permission.", ctx.guild)] }, 5);
    }
    const member = ctx.getMemberOption("member", 0);
    const role = ctx.getRoleOption("role", 1);
    if (!member || !role) return ctx.wrongUsage(roleaddCommand);

    if (member.roles.cache.has(role.id)) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${member.user.tag}** already has **${role.name}**.`, ctx.guild)] }, 5);
    }
    try {
      await member.roles.add(role.id, `Role added by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Added **${role.name}** to **${member.user.tag}**.`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to add role. Check my role hierarchy.", ctx.guild)] }, 5);
    }
  }
};
