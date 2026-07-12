import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const vcroleCommand: Command = {
  name: "vcrole",
  description: "Configure roles that are automatically assigned when users join voice channels.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "vcrole <add | remove | show | reset> <@role> [voiceChannelId | all]",
  examples: [
    "vcrole add @VoiceUser all",
    "vcrole add @GamingRoom 1135816865055256688",
    "vcrole remove @VoiceUser",
    "vcrole show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const role = ctx.getRoleOption("role", 1);
      const targetCh = ctx.getStringOption("channel", 2) || "all";

      if (!role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to add.", ctx.guild)] }, 5);
      }

      await prisma.whitelist.upsert({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } },
        update: { type: "vcrole", modules: [targetCh] },
        create: { guildId: ctx.guild.id, targetId: role.id, type: "vcrole", modules: [targetCh] }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`VC Role **${role.name}** registered for channel: \`${targetCh}\`.`, ctx.guild)] });
    }

    if (action === "remove") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to remove.", ctx.guild)] }, 5);
      }

      try {
        await prisma.whitelist.delete({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`VC Role **${role.name}** removed.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Role is not configured as a VC Role.", ctx.guild)] }, 5);
      }
    }

    if (action === "show" || !action) {
      const list = await prisma.whitelist.findMany({
        where: { guildId: ctx.guild.id, type: "vcrole" }
      });

      const desc = list.map(item => `• <@&${item.targetId}> → Channel: \`${item.modules[0] || "all"}\``).join("\n") || "No VC Roles configured.";
      return ctx.reply({ embeds: [UniversalEmbed.info("VC Roles Configurations", ctx.guild).setDescription(desc)] });
    }

    if (action === "reset") {
      await prisma.whitelist.deleteMany({
        where: { guildId: ctx.guild.id, type: "vcrole" }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("All VC Roles configurations reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `vcrole [add | remove | show | reset] ...`", ctx.guild)] });
  }
};
