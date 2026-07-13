import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const rolealiasCommand: Command = {
  name: "rolealias",
  description: "Create shortcut aliases for roles so you can reference them by a custom name.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "rolealias <set | remove | list> [alias] [role]",
  examples: [
    "rolealias set owner @The Rizz Master",
    "rolealias set mod Moderator",
    "rolealias remove owner",
    "rolealias list"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    // Load current aliases from GuildConfig logToggles JSON field
    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
    const settings = (config?.logToggles as Record<string, any>) ?? {};
    const aliases: Record<string, string> = settings.roleAliases ?? {};

    // ── SET ─────────────────────────────────────────────────────────────────
    if (action === "set") {
      const alias = ctx.getStringOption("alias", 1)?.toLowerCase();
      const role = ctx.getRoleOption("role", 2, true);

      if (!alias || !role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `rolealias set <alias> <role>`", ctx.guild)] }, 5);
      }

      if (/\s/.test(alias)) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Alias cannot contain spaces.", ctx.guild)] }, 5);
      }

      aliases[alias] = role.id;
      settings.roleAliases = aliases;

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles: settings },
        create: { guildId: ctx.guild.id, logToggles: settings }
      });

      return ctx.reply({
        embeds: [UniversalEmbed.success(
          `Role alias set: \`${alias}\` → **${role.name}**\nYou can now use \`${ctx.prefix}role add @member ${alias}\` to give that role.`,
          ctx.guild
        )]
      });
    }

    // ── REMOVE ──────────────────────────────────────────────────────────────
    if (action === "remove") {
      const alias = ctx.getStringOption("alias", 1)?.toLowerCase();
      if (!alias) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `rolealias remove <alias>`", ctx.guild)] }, 5);
      }

      if (!aliases[alias]) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Alias \`${alias}\` not found.`, ctx.guild)] }, 5);
      }

      const roleId = aliases[alias];
      const roleName = ctx.guild.roles.cache.get(roleId)?.name ?? roleId;
      delete aliases[alias];
      settings.roleAliases = aliases;

      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { logToggles: settings }
      });

      return ctx.reply({
        embeds: [UniversalEmbed.success(`Removed alias \`${alias}\` (was pointing to **${roleName}**).`, ctx.guild)]
      });
    }

    // ── LIST ────────────────────────────────────────────────────────────────
    if (action === "list" || !action) {
      if (Object.keys(aliases).length === 0) {
        return ctx.reply({ embeds: [UniversalEmbed.info("No role aliases configured.\nUse `rolealias set <alias> <role>` to add one.", ctx.guild)] });
      }

      const lines = Object.entries(aliases).map(([alias, roleId]) => {
        const roleName = ctx.guild.roles.cache.get(roleId)?.name ?? `Unknown Role (${roleId})`;
        return `• \`${alias}\` → **${roleName}**`;
      }).join("\n");

      return ctx.reply({
        embeds: [UniversalEmbed.info("Role Aliases", ctx.guild).setDescription(lines)]
      });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `rolealias [set|remove|list] [alias] [role]`", ctx.guild)] });
  }
};

/**
 * Resolve a role from an alias stored in this guild's config.
 * Returns the roleId string if found, null otherwise.
 */
export async function resolveRoleAlias(guildId: string, query: string): Promise<string | null> {
  const config = await prisma.guildConfig.findUnique({ where: { guildId } });
  const settings = (config?.logToggles as Record<string, any>) ?? {};
  const aliases: Record<string, string> = settings.roleAliases ?? {};
  return aliases[query.toLowerCase()] ?? null;
}
