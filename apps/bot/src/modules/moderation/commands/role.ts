import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { isWhitelisted } from "../../../utils/security.js";
import { PermissionFlagsBits, GuildMember, Role, ChannelType } from "discord.js";

// Helper: get all members with a role
async function fetchAllMembers(guild: any): Promise<GuildMember[]> {
  const members = await guild.members.fetch();
  return [...members.values()];
}

export const roleCommand: Command = {
  name: "role",
  description: "Manage server roles: add, remove, create, delete, rename, colour, and mass-assign.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "role <add|remove|create|delete|rename|colour|bots|humans|all> <@member|@role> [options]",
  examples: [
    "role add @member @Admin",
    "role remove @member @Muted",
    "role create VIP #FFD700",
    "role delete @OldRole",
    "role rename @OldRole NewName",
    "role colour @VIP #FF5733",
    "role bots @Bot-Role",
    "role humans @Member",
    "role all @Everyone",
    "role taskcancel"
  ],
  execute: async (ctx) => {
    const allowed = ctx.member.permissions.has(PermissionFlagsBits.ManageRoles);
    if (!allowed) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need the **Manage Roles** permission.", ctx.guild)] }, 5);
    }

    const sub = ctx.getStringOption("action", 0)?.toLowerCase();

    // --- ADD ---
    if (sub === "add") {
      const member = ctx.getMemberOption("member", 1);
      const role = ctx.getRoleOption("role", 2);
      if (!member || !role) return ctx.wrongUsage(roleCommand);

      if (member.roles.cache.has(role.id)) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`**${member.user.tag}** already has **${role.name}**.`, ctx.guild)] }, 5);
      }

      await member.roles.add(role.id, `Role added by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Added **${role.name}** to **${member.user.tag}**.`, ctx.guild)] });
    }

    // --- REMOVE ---
    if (sub === "remove") {
      const member = ctx.getMemberOption("member", 1);
      const role = ctx.getRoleOption("role", 2);
      if (!member || !role) return ctx.wrongUsage(roleCommand);

      if (!member.roles.cache.has(role.id)) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`**${member.user.tag}** doesn't have **${role.name}**.`, ctx.guild)] }, 5);
      }

      await member.roles.remove(role.id, `Role removed by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Removed **${role.name}** from **${member.user.tag}**.`, ctx.guild)] });
    }

    // --- CREATE ---
    if (sub === "create") {
      const name = ctx.args[1];
      const colorArg = ctx.args[2];
      if (!name) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role create <name> [#hexcolor]`", ctx.guild)] }, 5);

      const color = colorArg?.match(/^#[0-9A-Fa-f]{6}$/) ? parseInt(colorArg.slice(1), 16) : undefined;

      const role = await ctx.guild.roles.create({
        name,
        color,
        reason: `Created by ${ctx.user.tag}`
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Created role **${role.name}** (${role.id}).`, ctx.guild)] });
    }

    // --- DELETE ---
    if (sub === "delete") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify the role to delete.", ctx.guild)] }, 5);

      const name = role.name;
      await (role as any).delete(`Deleted by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🗑️ Deleted role **${name}**.`, ctx.guild)] });
    }

    // --- RENAME ---
    if (sub === "rename") {
      const role = ctx.getRoleOption("role", 1);
      const newName = ctx.args.slice(2).join(" ");
      if (!role || !newName) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role rename @role <new name>`", ctx.guild)] }, 5);

      await (role as any).setName(newName, `Renamed by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`✏️ Renamed role to **${newName}**.`, ctx.guild)] });
    }

    // --- COLOUR ---
    if (sub === "colour" || sub === "color") {
      const role = ctx.getRoleOption("role", 1);
      const colorArg = ctx.args[2];
      if (!role || !colorArg) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role colour @role #hexcolor`", ctx.guild)] }, 5);

      if (!colorArg.match(/^#[0-9A-Fa-f]{6}$/)) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Invalid hex color. Example: `#FF5733`", ctx.guild)] }, 5);
      }

      const colorInt = parseInt(colorArg.slice(1), 16);
      await (role as any).setColor(colorInt, `Color set by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🎨 Set **${role.name}** color to \`${colorArg}\`.`, ctx.guild)] });
    }

    // --- ICON ---
    if (sub === "icon") {
      const role = ctx.getRoleOption("role", 1);
      const iconUrl = ctx.args[2];
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role icon @role <emoji|url>`", ctx.guild)] }, 5);

      // Try emoji or URL
      const emojiMatch = iconUrl?.match(/^\p{Emoji}$/u) || iconUrl?.match(/^<a?:.+:\d+>$/);
      try {
        if (emojiMatch) {
          const emojiId = iconUrl.match(/\d+/)?.[0];
          await (role as any).setIcon(emojiId ? `https://cdn.discordapp.com/emojis/${emojiId}.png` : iconUrl);
        } else if (iconUrl) {
          await (role as any).setIcon(iconUrl);
        } else {
          await (role as any).setIcon(null); // remove icon
        }
        return ctx.reply({ embeds: [UniversalEmbed.success(`🖼️ Updated icon for **${role.name}**.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to set role icon. Server must be Level 2+ boosted.", ctx.guild)] }, 5);
      }
    }

    // --- BOTS ---
    if (sub === "bots") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role bots @role`", ctx.guild)] }, 5);

      const members = await fetchAllMembers(ctx.guild);
      const bots = members.filter(m => m.user.bot);
      await ctx.reply({ embeds: [UniversalEmbed.info(`⏳ Assigning **${role.name}** to **${bots.length}** bots...`, ctx.guild)] });

      let count = 0;
      for (const m of bots) {
        try { await m.roles.add(role.id); count++; } catch {}
      }
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Assigned **${role.name}** to **${count}** bots.`, ctx.guild)] });
    }

    // --- HUMANS ---
    if (sub === "humans") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role humans @role`", ctx.guild)] }, 5);

      const members = await fetchAllMembers(ctx.guild);
      const humans = members.filter(m => !m.user.bot);
      await ctx.reply({ embeds: [UniversalEmbed.info(`⏳ Assigning **${role.name}** to **${humans.length}** humans...`, ctx.guild)] });

      let count = 0;
      for (const m of humans) {
        try { await m.roles.add(role.id); count++; } catch {}
      }
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Assigned **${role.name}** to **${count}** humans.`, ctx.guild)] });
    }

    // --- ALL ---
    if (sub === "all") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role all @role`", ctx.guild)] }, 5);

      const members = await fetchAllMembers(ctx.guild);
      await ctx.reply({ embeds: [UniversalEmbed.info(`⏳ Assigning **${role.name}** to **${members.length}** members...`, ctx.guild)] });

      let count = 0;
      for (const m of members) {
        try { await m.roles.add(role.id); count++; } catch {}
      }
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Assigned **${role.name}** to **${count}** members.`, ctx.guild)] });
    }

    // --- TASKCANCEL (stop ongoing mass-assign — simplified: just inform) ---
    if (sub === "taskcancel") {
      return ctx.reply({ embeds: [UniversalEmbed.info("ℹ️ Mass role assignment tasks cannot be cancelled once started. Please wait for completion.", ctx.guild)] });
    }

    return ctx.reply({
      embeds: [UniversalEmbed.info(
        "**Role Management**\n" +
        "`role add @member @role` — Add role to member\n" +
        "`role remove @member @role` — Remove role from member\n" +
        "`role create <name> [#color]` — Create new role\n" +
        "`role delete @role` — Delete a role\n" +
        "`role rename @role <name>` — Rename a role\n" +
        "`role colour @role #hex` — Change role color\n" +
        "`role icon @role <url>` — Set role icon\n" +
        "`role bots @role` — Assign role to all bots\n" +
        "`role humans @role` — Assign role to all humans\n" +
        "`role all @role` — Assign role to everyone",
        ctx.guild
      )]
    });
  }
};
