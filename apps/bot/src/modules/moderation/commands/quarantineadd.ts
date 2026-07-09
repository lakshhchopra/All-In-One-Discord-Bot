import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";
import { setCache } from "../../../services/redis.js";

export const quarantineaddCommand: Command = {
  name: "quarantineadd",
  aliases: ["quarantine add"],
  description: "Quarantine a member — strips all roles and assigns the quarantine role.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "quarantineadd <@member>",
  examples: ["quarantineadd @member"],
  execute: async (ctx) => {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } }) as any;
    if (!config?.quarantineRoleId) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Quarantine role is not set. Use `quarantinesetup @role` first.", ctx.guild)] }, 5);
    }

    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(quarantineaddCommand);
    if (target.id === ctx.member.id) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You cannot quarantine yourself.", ctx.guild)] }, 5);
    }
    if (target.id === ctx.guild.ownerId) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You cannot quarantine the server owner.", ctx.guild)] }, 5);
    }

    // Save their current roles
    const roles = target.roles.cache.filter(r => r.id !== ctx.guild.roles.everyone.id).map(r => r.id);
    await setCache(`quarantine:${ctx.guild.id}:${target.id}`, roles);

    try {
      await target.roles.set([config.quarantineRoleId], `Quarantined by ${ctx.user.tag}`);
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to quarantine. Check my role hierarchy.", ctx.guild)] }, 5);
    }

    return ctx.reply({ embeds: [UniversalEmbed.success(`🔒 **${target.user.tag}** has been quarantined.`, ctx.guild)] });
  }
};
