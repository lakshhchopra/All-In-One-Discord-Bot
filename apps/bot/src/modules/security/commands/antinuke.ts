import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const antinukeCommand: Command = {
  name: "antinuke",
  description: "Configure Anti-Nuke options.",
  category: "Security",
  permissionLevel: "OWNER",
  usage: "antinuke <enable | disable | setup | log | [category]> [limit]",
  examples: [
    "antinuke enable",
    "antinuke setup",
    "antinuke channelDelete 5",
    "antinuke log"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiNukeEnabled: true },
        create: { guildId: ctx.guild.id, antiNukeEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Nuke system enabled.", ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiNukeEnabled: false },
        create: { guildId: ctx.guild.id, antiNukeEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Nuke system disabled.", ctx.guild)] });
    }

    if (action === "setup") {
      const defaultLimits = {
        channelDelete: 3,
        roleDelete: 3,
        banKick: 5,
        webhookCreate: 2
      };
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiNukeLimits: defaultLimits, antiNukeEnabled: true },
        create: { guildId: ctx.guild.id, antiNukeLimits: defaultLimits, antiNukeEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Nuke configured and enabled with default limits: 3 channel/role deletes and 5 bans/kicks within a minute.", ctx.guild)] });
    }

    if (action === "log") {
      const logs = await prisma.auditLog.findMany({
        where: { guildId: ctx.guild.id, action: { startsWith: "Antinuke" } },
        orderBy: { createdAt: "desc" },
        take: 5
      });
      const desc = logs.map(l => `• **${l.createdAt.toLocaleTimeString()}** - ${l.action}: ${l.reason}`).join("\n") || "No Anti-Nuke triggers recorded.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Anti-Nuke Security Logs", ctx.guild).setDescription(desc)] });
    }

    const limitName = ctx.getStringOption("action", 0);
    const limitVal = ctx.getIntegerOption("limit", 1);
    if (limitVal !== null && limitName) {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const currentLimits = (config?.antiNukeLimits as Record<string, number>) ?? {};
      currentLimits[limitName] = limitVal;

      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { antiNukeLimits: currentLimits }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Anti-Nuke limit for **${limitName}** updated to \`${limitVal}\``, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `antinuke [enable|disable|setup|log|[category]] [limit]`", ctx.guild)] });
  }
};
