import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";

export const vcroleremoveCommand: Command = {
  name: "vcroleremove",
  aliases: ["vcrole remove", "vcrole delete"],
  description: "Remove a VC role configuration for a role.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "vcroleremove <@role>",
  examples: ["vcroleremove @VoiceUser"],
  execute: async (ctx) => {
    const role = ctx.getRoleOption("role", 0);
    if (!role) return ctx.wrongUsage(vcroleremoveCommand);

    try {
      await prisma.whitelist.delete({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`✅ VC Role **${role.name}** configuration removed.`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error(`**${role.name}** is not configured as a VC Role.`, ctx.guild)] }, 5);
    }
  }
};
