import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const whitelistCommand: Command = {
  name: "whitelist",
  description: "Whitelist members or roles from security triggers.",
  category: "Security",
  permissionLevel: "OWNER",
  usage: "whitelist <add | remove | show | reset | role> [options]",
  examples: [
    "whitelist add @member",
    "whitelist remove @member",
    "whitelist role add @Moderator",
    "whitelist show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "role") {
      const sub = ctx.getStringOption("sub", 1)?.toLowerCase();
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      if (sub === "add") {
        await prisma.whitelist.upsert({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } },
          update: { type: "role" },
          create: { guildId: ctx.guild.id, targetId: role.id, type: "role" }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Role ${role} added to whitelist.`, ctx.guild)] });
      }

      if (sub === "remove") {
        try {
          await prisma.whitelist.delete({
            where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } }
          });
          return ctx.reply({ embeds: [UniversalEmbed.success(`Role ${role} removed from whitelist.`, ctx.guild)] });
        } catch {
          return ctx.reply({ embeds: [UniversalEmbed.error("Role is not in whitelist.", ctx.guild)] }, 5);
        }
      }
    }

    if (action === "add") {
      const targetUser = ctx.getMemberOption("member", 1);
      if (!targetUser) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to whitelist.", ctx.guild)] }, 5);

      await prisma.whitelist.upsert({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId: targetUser.id } },
        update: { type: "user" },
        create: { guildId: ctx.guild.id, targetId: targetUser.id, type: "user" }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Member **${targetUser.user.tag}** whitelisted successfully.`, ctx.guild)] });
    }

    if (action === "remove") {
      const targetUser = ctx.getMemberOption("member", 1);
      if (!targetUser) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to remove.", ctx.guild)] }, 5);

      try {
        await prisma.whitelist.delete({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: targetUser.id } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Member **${targetUser.user.tag}** removed from whitelist.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in whitelist.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const list = await prisma.whitelist.findMany({ where: { guildId: ctx.guild.id } });
      const roles = list.filter(w => w.type === "role").map(w => `<@&${w.targetId}>`).join(", ") || "None";
      const users = list.filter(w => w.type === "user").map(w => `<@${w.targetId}>`).join(", ") || "None";

      const embed = UniversalEmbed.info("Security Whitelist Configuration", ctx.guild)
        .addFields(
          { name: "Whitelisted Roles", value: roles },
          { name: "Whitelisted Users", value: users }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      await prisma.whitelist.deleteMany({ where: { guildId: ctx.guild.id } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Security whitelist has been reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `whitelist [add|remove|show|reset|role] ...`", ctx.guild)] });
  }
};
