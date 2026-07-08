import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const logCommand: Command = {
  name: "log",
  description: "Configure logging settings (enable/disable specific logs).",
  category: "Logging",
  permissionLevel: "ADMIN",
  usage: "log <enable | disable | [category]> [enable | disable]",
  examples: [
    "log enable",
    "log message disable",
    "log moderation enable"
  ],
  execute: async (ctx) => {
    const category = ctx.getStringOption("category", 0)?.toLowerCase(); // enable, disable, message, moderation, member, invite, voice, server
    const action = ctx.getStringOption("action", 1)?.toLowerCase(); // enable/disable for subcategories

    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
    if (!category) {
      return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `log [enable|disable|[category]] [enable|disable]`", ctx.guild)] });
    }

    if (category === "enable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logEnabled: true },
        create: { guildId: ctx.guild.id, logEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Global logging enabled.", ctx.guild)] });
    }

    if (category === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logEnabled: false },
        create: { guildId: ctx.guild.id, logEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Global logging disabled.", ctx.guild)] });
    }

    const categories = ["message", "moderation", "member", "invite", "voice", "server"];
    if (categories.includes(category)) {
      if (!action || (action !== "enable" && action !== "disable")) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Usage: \`log ${category} [enable|disable]\``, ctx.guild)] }, 5);
      }

      const logToggles = (config?.logToggles as Record<string, boolean>) ?? {};
      logToggles[category] = action === "enable";
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles },
        create: { guildId: ctx.guild.id, logToggles }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Logging for category **${category}** has been **${action}d**`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `log [enable|disable|[category]] [enable|disable]`", ctx.guild)] });
  }
};
