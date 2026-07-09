import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { setCache, getCache, deleteCache } from "../../../services/redis.js";

export const quarantineCommand: Command = {
  name: "quarantine",
  description: "Manage quarantined users.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "quarantine <show | role | add | remove | reset> [@member | @role]",
  examples: [
    "quarantine show",
    "quarantine role @Quarantined",
    "quarantine add @member",
    "quarantine remove @member"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "role") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a quarantine role.", ctx.guild)] }, 5);

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { quarantineRoleId: role.id } as any,
        create: { guildId: ctx.guild.id, quarantineRoleId: role.id } as any
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Quarantine role set to **${role.name}**.`, ctx.guild)] });
    }

    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } }) as any;
    const qRoleId = config?.quarantineRoleId;
    if (!qRoleId) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Quarantine role is not configured. Set it using `quarantine role <@role>`.", ctx.guild)] }, 5);
    }

    if (action === "add") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member to quarantine.", ctx.guild)] }, 5);

      if (target.id === ctx.member.id) {
        return ctx.reply({ embeds: [UniversalEmbed.error("You cannot quarantine yourself.", ctx.guild)] }, 5);
      }

      // Save current roles (excluding @everyone)
      const roles = target.roles.cache.filter(r => r.id !== ctx.guild.roles.everyone.id).map(r => r.id);
      await setCache(`quarantine:${ctx.guild.id}:${target.id}`, roles);

      // Remove roles and assign quarantine role
      try {
        await target.roles.set([qRoleId], "User quarantined.");
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to update member roles. Check bot hierarchy.", ctx.guild)] }, 5);
      }

      return ctx.reply({ embeds: [UniversalEmbed.success(`**${target.user.tag}** has been quarantined successfully.`, ctx.guild)] });
    }

    if (action === "remove") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member to unquarantine.", ctx.guild)] }, 5);

      const oldRoles = await getCache<string[]>(`quarantine:${ctx.guild.id}:${target.id}`) || [];

      try {
        await target.roles.set(oldRoles, "User unquarantined.");
        await deleteCache(`quarantine:${ctx.guild.id}:${target.id}`);
      } catch (err) {
        // Fallback: remove only the quarantine role
        try {
          await target.roles.remove(qRoleId);
        } catch {}
      }

      return ctx.reply({ embeds: [UniversalEmbed.success(`**${target.user.tag}** has been unquarantined.`, ctx.guild)] });
    }

    if (action === "show" || !action) {
      const list = ctx.guild.members.cache.filter(m => m.roles.cache.has(qRoleId));
      const description = list.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No quarantined users.";

      const embed = UniversalEmbed.info("Quarantined Users List", ctx.guild)
        .setDescription(description);
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      const list = ctx.guild.members.cache.filter(m => m.roles.cache.has(qRoleId));
      for (const m of list.values()) {
        const oldRoles = await getCache<string[]>(`quarantine:${ctx.guild.id}:${m.id}`) || [];
        try {
          await m.roles.set(oldRoles);
          await deleteCache(`quarantine:${ctx.guild.id}:${m.id}`);
        } catch {}
      }
      return ctx.reply({ embeds: [UniversalEmbed.success("All quarantined users have been reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `quarantine [show|role|add|remove|reset] ...`", ctx.guild)] });
  }
};
