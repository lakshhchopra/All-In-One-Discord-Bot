import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const roleCommand: Command = {
  name: "role",
  description: "Manage roles for server members.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "role <add | remove> <member> <role>",
  examples: ["role add @member @Admin", "role remove @member @Mod"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    const action = ctx.getStringOption("action", 0);
    const member = ctx.getMemberOption("member", 1);
    const role = ctx.getRoleOption("role", 2);

    if (!action || !member || !role || (action !== "add" && action !== "remove")) {
      return ctx.wrongUsage(roleCommand);
    }

    if (action === "add") {
      if (member.roles.cache.has(role.id)) {
        return ctx.reply({ embeds: [UniversalEmbed.warning("This member already has that role.", ctx.guild)] }, 5);
      }
      await member.roles.add(role.id);
      return ctx.reply({ embeds: [UniversalEmbed.success(`Added role **${role.name}** to **${member.user.tag}**`, ctx.guild)] });
    }

    if (action === "remove") {
      if (!member.roles.cache.has(role.id)) {
        return ctx.reply({ embeds: [UniversalEmbed.warning("This member does not have that role.", ctx.guild)] }, 5);
      }
      await member.roles.remove(role.id);
      return ctx.reply({ embeds: [UniversalEmbed.success(`Removed role **${role.name}** from **${member.user.tag}**`, ctx.guild)] });
    }

    return ctx.wrongUsage(roleCommand);
  }
};
