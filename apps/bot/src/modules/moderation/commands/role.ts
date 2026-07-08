import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { resolveRoleAlias } from "./rolealias.js";

export const roleCommand: Command = {
  name: "role",
  description: "Manage roles for server members.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "role <add | remove> <member> <role name | alias | @role | role id>",
  examples: [
    "role add @member jhandu",
    "role add 982232494223020042 owner",
    "role remove @member Admin"
  ],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    const action = ctx.getStringOption("action", 0)?.toLowerCase();
    const member = ctx.getMemberOption("member", 1);

    if (!action || !member || (action !== "add" && action !== "remove")) {
      return ctx.wrongUsage(roleCommand);
    }

    // Resolve role: mention/ID/name first, then alias fallback
    let role = ctx.getRoleOption("role", 2);

    if (!role) {
      const rawArg = ctx.args[2];
      if (rawArg) {
        const aliasedId = await resolveRoleAlias(ctx.guild.id, rawArg);
        if (aliasedId) {
          role = ctx.guild.roles.cache.get(aliasedId) ?? null;
        }
      }
    }

    if (!role) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Role not found. Use a role mention, ID, name, or alias (`-rolealias list`).", ctx.guild)] }, 5);
    }

    try {
      if (action === "add") {
        if (member.roles.cache.has(role.id)) {
          return ctx.reply({ embeds: [UniversalEmbed.warning(`${member.user.tag} already has **${role.name}**.`, ctx.guild)] }, 5);
        }
        await member.roles.add(role.id);
        return ctx.reply({ embeds: [UniversalEmbed.success(`Added role **${role.name}** to **${member.user.tag}**`, ctx.guild)] });
      }

      if (action === "remove") {
        if (!member.roles.cache.has(role.id)) {
          return ctx.reply({ embeds: [UniversalEmbed.warning(`${member.user.tag} doesn't have **${role.name}**.`, ctx.guild)] }, 5);
        }
        await member.roles.remove(role.id);
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed role **${role.name}** from **${member.user.tag}**`, ctx.guild)] });
      }
    } catch (err: any) {
      if (err.code === 50013) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Missing Permissions: Make sure my role is above the target role in the hierarchy and I have **Manage Roles**.", ctx.guild)] }, 5);
      }
      throw err;
    }

    return ctx.wrongUsage(roleCommand);
  }
};
