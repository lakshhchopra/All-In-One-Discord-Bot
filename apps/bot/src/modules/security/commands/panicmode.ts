import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const panicmodeCommand: Command = {
  name: "panicmode",
  description: "Enable or disable emergency panic mode to lock down the server.",
  category: "Security",
  permissionLevel: "OWNER",
  usage: "panicmode <enable | disable | setup | show | reset>",
  examples: [
    "panicmode enable",
    "panicmode disable",
    "panicmode show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { panicModeEnabled: true },
        create: { guildId: ctx.guild.id, panicModeEnabled: true }
      });

      // Optionally lock down the guild's default role permissions or alert
      return ctx.reply({ embeds: [UniversalEmbed.success("🔴 **PANIC MODE ENABLED!** Server lock down active. Direct permissions are restricted.", ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { panicModeEnabled: false },
        create: { guildId: ctx.guild.id, panicModeEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("🟢 **Panic mode disabled.** Server operations restored.", ctx.guild)] });
    }

    if (action === "show" || action === "setup") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Panic Mode Configuration", ctx.guild)
            .setDescription(
              `- **Panic Mode Status:** ${config?.panicModeEnabled ? "🔴 ENABLED (Lockdown Active)" : "🟢 Disabled"}`
            )
        ]
      });
    }

    if (action === "reset") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { panicModeEnabled: false },
        create: { guildId: ctx.guild.id, panicModeEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Panic mode reset to disabled.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `panicmode [enable | disable | setup | show | reset]`", ctx.guild)] });
  }
};
