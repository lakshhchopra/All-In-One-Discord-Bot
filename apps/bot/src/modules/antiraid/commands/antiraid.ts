import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const antiraidCommand: Command = {
  name: "antiraid",
  description: "Configure Anti-Raid limits and settings.",
  category: "Anti Raid",
  permissionLevel: "ADMIN",
  usage: "antiraid <enable | disable | setup | joins | accountage> [limit/days]",
  examples: [
    "antiraid enable",
    "antiraid setup",
    "antiraid joins 15",
    "antiraid accountage 7"
  ],
  execute: async (ctx: any) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiRaidEnabled: true },
        create: { guildId: ctx.guild.id, antiRaidEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Raid protection enabled.", ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiRaidEnabled: false },
        create: { guildId: ctx.guild.id, antiRaidEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Raid protection disabled.", ctx.guild)] });
    }

    if (action === "setup") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: {
          antiRaidEnabled: true,
          antiRaidJoinsLimit: 10,
          antiRaidJoinsWindow: 15,
          antiRaidMinAgeDays: 5,
          antiRaidAction: "kick"
        },
        create: {
          guildId: ctx.guild.id,
          antiRaidEnabled: true,
          antiRaidJoinsLimit: 10,
          antiRaidJoinsWindow: 15,
          antiRaidMinAgeDays: 5,
          antiRaidAction: "kick"
        }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Raid configured: Joins limit 10/15s, Min Account Age: 5 days, Action: Kick.", ctx.guild)] });
    }

    if (action === "joins") {
      const limit = ctx.getIntegerOption("limit", 1);
      if (limit === null) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a join limit.", ctx.guild)] }, 5);
      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { antiRaidJoinsLimit: limit }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Anti-Raid joins limit set to **${limit}**`, ctx.guild)] });
    }

    if (action === "accountage") {
      const days = ctx.getIntegerOption("days", 1);
      if (days === null) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify minimum days.", ctx.guild)] }, 5);
      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { antiRaidMinAgeDays: days }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Anti-Raid min account age set to **${days}** days.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `antiraid [enable|disable|setup|joins|accountage] [limit/days]`", ctx.guild)] });
  }
};

