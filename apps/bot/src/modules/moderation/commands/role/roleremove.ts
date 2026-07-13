import { PermissionFlagsBits, Role } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";

export const roleremoveCommand: Command = {
  name: "roleremove",
  aliases: ["role remove"],
  description: "Remove a role from a member.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "roleremove <@member> <@role>",
  examples: ["roleremove @member @VIP"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need the **Manage Roles** permission.", ctx.guild)] }, 5);
    }
    const member = ctx.getMemberOption("member", 0);
    let role = ctx.getRoleOption("role", 1, true) as Role | null;

    // Check aliases if role isn't directly found by name or ID
    if (!role && ctx.args.length > 1) {
      const query = ctx.args.slice(1).join(" ").toLowerCase();
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const settings = (config?.logToggles as Record<string, any>) ?? {};
      const aliases: Record<string, string> = settings.roleAliases ?? {};
      
      if (aliases[query]) {
        role = ctx.guild.roles.cache.get(aliases[query]) || null;
      }
    }

    if (!member || !role) return ctx.wrongUsage(roleremoveCommand);

    if (!member.roles.cache.has(role.id)) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${member.user.tag}** doesn't have **${role.name}**.`, ctx.guild)] }, 5);
    }
    try {
      await member.roles.remove(role.id, `Role removed by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Removed **${role.name}** from **${member.user.tag}**.`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to remove role. Check my role hierarchy.", ctx.guild)] }, 5);
    }
  }
};
