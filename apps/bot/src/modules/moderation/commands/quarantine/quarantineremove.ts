import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";
import { getCache, deleteCache } from "../../../../services/redis.js";

export const quarantineremoveCommand: Command = {
  name: "quarantineremove",
  aliases: ["quarantine remove", "unquarantine"],
  description: "Remove quarantine from a member, restoring their previous roles.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "quarantineremove <@member>",
  examples: ["quarantineremove @member"],
  execute: async (ctx) => {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } }) as any;
    if (!config?.quarantineRoleId) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Quarantine role is not configured.", ctx.guild)] }, 5);
    }

    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(quarantineremoveCommand);

    if (!target.roles.cache.has(config.quarantineRoleId)) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${target.user.tag}** is not quarantined.`, ctx.guild)] }, 5);
    }

    const oldRoles = await getCache<string[]>(`quarantine:${ctx.guild.id}:${target.id}`) || [];

    try {
      await target.roles.set(oldRoles.length ? oldRoles : [], `Unquarantined by ${ctx.user.tag}`);
      await deleteCache(`quarantine:${ctx.guild.id}:${target.id}`);
    } catch {
      // Fallback: just remove the quarantine role
      try { await target.roles.remove(config.quarantineRoleId); } catch {}
    }

    return ctx.reply({ embeds: [UniversalEmbed.success(`🔓 **${target.user.tag}** has been released from quarantine.`, ctx.guild)] });
  }
};
