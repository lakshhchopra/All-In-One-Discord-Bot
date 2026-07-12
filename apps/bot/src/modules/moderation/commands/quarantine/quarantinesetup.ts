import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";

export const quarantinesetupCommand: Command = {
  name: "quarantinesetup",
  aliases: ["quarantine setup", "quarantineconfig", "quarantine config"],
  description: "Set the quarantine role for this server.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "quarantinesetup <@role>",
  examples: ["quarantinesetup @Quarantined"],
  execute: async (ctx) => {
    const role = ctx.getRoleOption("role", 0);
    if (!role) return ctx.wrongUsage(quarantinesetupCommand);

    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { quarantineRoleId: role.id } as any,
      create: { guildId: ctx.guild.id, quarantineRoleId: role.id } as any
    });

    return ctx.reply({
      embeds: [UniversalEmbed.success(
        `✅ Quarantine role set to **${role.name}**.\n\nNow use \`quarantineadd @member\` to quarantine members.`,
        ctx.guild
      )]
    });
  }
};
