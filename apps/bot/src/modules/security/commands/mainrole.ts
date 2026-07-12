import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const mainroleCommand: Command = {
  name: "mainrole",
  description: "Configure main roles for verification or access.",
  category: "Security",
  permissionLevel: "OWNER",
  usage: "mainrole <add | remove | show | reset> [role]",
  examples: [
    "mainrole add @Member",
    "mainrole remove @Member",
    "mainrole show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify/mention a role.", ctx.guild)] }, 5);
      }

      await prisma.whitelist.upsert({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } },
        update: { type: "mainrole" },
        create: { guildId: ctx.guild.id, targetId: role.id, type: "mainrole" }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${role.name}** as a main role.`, ctx.guild)] });
    }

    if (action === "remove") {
      const role = ctx.getRoleOption("role", 1);
      if (!role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify/mention a role.", ctx.guild)] }, 5);
      }

      try {
        await prisma.whitelist.delete({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${role.name}** from main roles.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Role is not configured as a main role.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const list = await prisma.whitelist.findMany({
        where: { guildId: ctx.guild.id, type: "mainrole" }
      });
      const roles = list.map(r => `<@&${r.targetId}>`).join(", ") || "None";
      return ctx.reply({ embeds: [UniversalEmbed.info("Main Roles List", ctx.guild).setDescription(roles)] });
    }

    if (action === "reset") {
      await prisma.whitelist.deleteMany({
        where: { guildId: ctx.guild.id, type: "mainrole" }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Main roles list reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `mainrole [add|remove|show|reset] [role]`", ctx.guild)] });
  }
};
