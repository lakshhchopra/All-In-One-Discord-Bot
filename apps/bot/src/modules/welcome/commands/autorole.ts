import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const autoroleCommand: Command = {
  name: "autorole",
  description: "Setup auto roles for humans and bots.",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "autorole <humans | bots | show | reset | enable | disable> [add | remove | enable | disable | show | reset] [role]",
  examples: [
    "autorole humans add @Member",
    "autorole bots add @BotRole",
    "autorole show",
    "autorole reset"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      return ctx.reply({ embeds: [UniversalEmbed.success("Auto roles system is **enabled**.", ctx.guild)] });
    }

    if (action === "disable") {
      return ctx.reply({ embeds: [UniversalEmbed.success("Auto roles system is **disabled**.", ctx.guild)] });
    }

    if (action === "humans") {
      const sub = ctx.getStringOption("sub", 1)?.toLowerCase();

      if (sub === "enable") {
        return ctx.reply({ embeds: [UniversalEmbed.success("Human auto roles are **enabled**.", ctx.guild)] });
      }
      if (sub === "disable") {
        return ctx.reply({ embeds: [UniversalEmbed.success("Human auto roles are **disabled**.", ctx.guild)] });
      }

      const role = ctx.getRoleOption("role", 2);
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let roles = config?.autoRolesHumans ?? [];

      if (sub === "add") {
        if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to add.", ctx.guild)] }, 5);
        if (!roles.includes(role.id)) roles.push(role.id);
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { autoRolesHumans: roles },
          create: { guildId: ctx.guild.id, autoRolesHumans: roles }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Added ${role} to human auto roles.`, ctx.guild)] });
      }

      if (sub === "remove") {
        if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to remove.", ctx.guild)] }, 5);
        roles = roles.filter(r => r !== role.id);
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { autoRolesHumans: roles },
          create: { guildId: ctx.guild.id, autoRolesHumans: roles }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed ${role} from human auto roles.`, ctx.guild)] });
      }

      if (sub === "show" || !sub) {
        const listText = roles.map(id => `<@&${id}>`).join(", ") || "None";
        return ctx.reply({ embeds: [UniversalEmbed.info("Human Auto Roles", ctx.guild).setDescription(listText)] });
      }

      if (sub === "reset") {
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { autoRolesHumans: [] },
          create: { guildId: ctx.guild.id, autoRolesHumans: [] }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success("Human auto roles list reset.", ctx.guild)] });
      }
    }

    if (action === "bots") {
      const sub = ctx.getStringOption("sub", 1)?.toLowerCase();

      if (sub === "enable") {
        return ctx.reply({ embeds: [UniversalEmbed.success("Bot auto roles are **enabled**.", ctx.guild)] });
      }
      if (sub === "disable") {
        return ctx.reply({ embeds: [UniversalEmbed.success("Bot auto roles are **disabled**.", ctx.guild)] });
      }

      const role = ctx.getRoleOption("role", 2);
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let roles = config?.autoRolesBots ?? [];

      if (sub === "add") {
        if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to add.", ctx.guild)] }, 5);
        if (!roles.includes(role.id)) roles.push(role.id);
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { autoRolesBots: roles },
          create: { guildId: ctx.guild.id, autoRolesBots: roles }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Added ${role} to bot auto roles.`, ctx.guild)] });
      }

      if (sub === "remove") {
        if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to remove.", ctx.guild)] }, 5);
        roles = roles.filter(r => r !== role.id);
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { autoRolesBots: roles },
          create: { guildId: ctx.guild.id, autoRolesBots: roles }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed ${role} from bot auto roles.`, ctx.guild)] });
      }

      if (sub === "show" || !sub) {
        const listText = roles.map(id => `<@&${id}>`).join(", ") || "None";
        return ctx.reply({ embeds: [UniversalEmbed.info("Bot Auto Roles", ctx.guild).setDescription(listText)] });
      }

      if (sub === "reset") {
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { autoRolesBots: [] },
          create: { guildId: ctx.guild.id, autoRolesBots: [] }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success("Bot auto roles list reset.", ctx.guild)] });
      }
    }

    if (action === "show") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const humans = config?.autoRolesHumans.map(id => `<@&${id}>`).join(", ") || "None";
      const bots = config?.autoRolesBots.map(id => `<@&${id}>`).join(", ") || "None";

      const embed = UniversalEmbed.info("Auto Roles List", ctx.guild)
        .addFields(
          { name: "Humans Auto Roles", value: humans },
          { name: "Bots Auto Roles", value: bots }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { autoRolesHumans: [], autoRolesBots: [] },
        create: { guildId: ctx.guild.id, autoRolesHumans: [], autoRolesBots: [] }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("All auto roles reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `autorole [humans|bots|show|reset|enable|disable] [subaction] [role]`", ctx.guild)] });
  }
};
