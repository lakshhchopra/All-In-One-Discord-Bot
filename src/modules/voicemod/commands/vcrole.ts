import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const vcroleCommand: Command = {
  name: "vcrole",
  description: "Configure voice auto roles assigned to users in VC.",
  category: "Voice Moderation",
  permissionLevel: "ADMIN",
  usage: "vcrole <humans | bots | show | reset> [add | remove] [role]",
  examples: [
    "vcrole humans add @InVC",
    "vcrole bots add @BotInVC",
    "vcrole show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    // We store vcRoles configuration inside GuildConfig settings json column
    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
    const settings = (config?.logToggles as Record<string, any>) ?? {};
    let vcHumans = settings.vcRolesHumans ?? [];
    let vcBots = settings.vcRolesBots ?? [];

    if (action === "humans") {
      const sub = ctx.getStringOption("sub", 1)?.toLowerCase();
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      if (sub === "add") {
        if (!vcHumans.includes(role.id)) vcHumans.push(role.id);
      } else if (sub === "remove") {
        vcHumans = vcHumans.filter((id: string) => id !== role.id);
      }
      settings.vcRolesHumans = vcHumans;

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles: settings },
        create: { guildId: ctx.guild.id, logToggles: settings }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice auto-roles for humans updated.`, ctx.guild)] });
    }

    if (action === "bots") {
      const sub = ctx.getStringOption("sub", 1)?.toLowerCase();
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      if (sub === "add") {
        if (!vcBots.includes(role.id)) vcBots.push(role.id);
      } else if (sub === "remove") {
        vcBots = vcBots.filter((id: string) => id !== role.id);
      }
      settings.vcRolesBots = vcBots;

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles: settings },
        create: { guildId: ctx.guild.id, logToggles: settings }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice auto-roles for bots updated.`, ctx.guild)] });
    }

    if (action === "show") {
      const humansList = vcHumans.map((id: string) => `<@&${id}>`).join(", ") || "None";
      const botsList = vcBots.map((id: string) => `<@&${id}>`).join(", ") || "None";

      const embed = UniversalEmbed.info("Voice Auto Roles Settings", ctx.guild)
        .addFields(
          { name: "Humans VC Roles", value: humansList },
          { name: "Bots VC Roles", value: botsList }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      settings.vcRolesHumans = [];
      settings.vcRolesBots = [];
      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { logToggles: settings }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice auto-roles has been reset.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `vcrole [humans|bots|show|reset] [add|remove] [role]`", ctx.guild)] });
  }
};
