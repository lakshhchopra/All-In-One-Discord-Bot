import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const autoroleCommand: Command = {
  name: "autorole",
  description: "Setup auto roles for humans and bots.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  usage: "autorole <humans | bots | show | reset> [add | remove] [role]",
  examples: [
    "autorole humans add @Member",
    "autorole bots add @BotRole",
    "autorole show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "humans") {
      const sub = ctx.getStringOption("sub", 1)?.toLowerCase();
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let roles = config?.autoRolesHumans ?? [];

      if (sub === "add") {
        if (!roles.includes(role.id)) roles.push(role.id);
      } else if (sub === "remove") {
        roles = roles.filter(r => r !== role.id);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { autoRolesHumans: roles },
        create: { guildId: ctx.guild.id, autoRolesHumans: roles }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Human autoroles updated.`, ctx.guild)] });
    }

    if (action === "bots") {
      const sub = ctx.getStringOption("sub", 1)?.toLowerCase();
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let roles = config?.autoRolesBots ?? [];

      if (sub === "add") {
        if (!roles.includes(role.id)) roles.push(role.id);
      } else if (sub === "remove") {
        roles = roles.filter(r => r !== role.id);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { autoRolesBots: roles },
        create: { guildId: ctx.guild.id, autoRolesBots: roles }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Bot autoroles updated.`, ctx.guild)] });
    }

    if (action === "show") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const humans = config?.autoRolesHumans.map(id => `<@&${id}>`).join(", ") || "None";
      const bots = config?.autoRolesBots.map(id => `<@&${id}>`).join(", ") || "None";

      const embed = UniversalEmbed.info("Auto Roles List", ctx.guild)
        .addFields(
          { name: "Humans Autoroles", value: humans },
          { name: "Bots Autoroles", value: bots }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { autoRolesHumans: [], autoRolesBots: [] },
        create: { guildId: ctx.guild.id, autoRolesHumans: [], autoRolesBots: [] }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Auto roles configuration reset.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `autorole [humans|bots|show|reset] [add|remove] [role]`", ctx.guild)] });
  }
};
