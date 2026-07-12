import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";
import { deleteCache } from "../../../../services/redis.js";

export const quarantineresetCommand: Command = {
  name: "quarantinereset",
  aliases: ["quarantine reset"],
  description: "Release all quarantined members and reset the quarantine role setting.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "quarantinereset",
  examples: ["quarantinereset"],
  execute: async (ctx) => {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } }) as any;
    if (!config?.quarantineRoleId) {
      return ctx.reply({ embeds: [UniversalEmbed.error("No quarantine role configured.", ctx.guild)] }, 5);
    }

    const list = ctx.guild.members.cache.filter(m => m.roles.cache.has(config.quarantineRoleId!));
    let released = 0;

    for (const m of list.values()) {
      try {
        await m.roles.remove(config.quarantineRoleId!);
        await deleteCache(`quarantine:${ctx.guild.id}:${m.id}`);
        released++;
      } catch {}
    }

    await prisma.guildConfig.update({
      where: { guildId: ctx.guild.id },
      data: { quarantineRoleId: null } as any
    });

    return ctx.reply({
      embeds: [UniversalEmbed.success(
        `✅ Released **${released}** quarantined member(s) and cleared the quarantine role config.`,
        ctx.guild
      )]
    });
  }
};
