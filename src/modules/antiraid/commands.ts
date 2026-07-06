import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { TextChannel } from "discord.js";

export const antiraidCommand: Command = {
  name: "antiraid",
  description: "Configure Anti-Raid limits and settings.",
  category: "Anti Raid",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // enable, disable, setup, joins, accountage, autoban

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

export const raidlockCommand: Command = {
  name: "raidlock",
  description: "Locks down the server to prevent any messages.",
  category: "Anti Raid",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const textChannels = ctx.guild.channels.cache.filter(c => c.isTextBased() && !c.isDMBased());
    for (const [_, ch] of textChannels) {
      try {
        if (ch instanceof TextChannel) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
        }
      } catch {}
    }
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { antiRaidLocked: true },
      create: { guildId: ctx.guild.id, antiRaidLocked: true }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("🚨 Server locked down. All channels locked from sending messages.", ctx.guild)] });
  }
};

export const unraidlockCommand: Command = {
  name: "unraidlock",
  description: "Removes server lock down.",
  category: "Anti Raid",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const textChannels = ctx.guild.channels.cache.filter(c => c.isTextBased() && !c.isDMBased());
    for (const [_, ch] of textChannels) {
      try {
        if (ch instanceof TextChannel) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: null });
        }
      } catch {}
    }
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { antiRaidLocked: false },
      create: { guildId: ctx.guild.id, antiRaidLocked: false }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("✅ Server unlocked. Everyone can send messages again.", ctx.guild)] });
  }
};

export function registerAntiRaid() {
  CommandRegistry.register(antiraidCommand);
  CommandRegistry.register(raidlockCommand);
  CommandRegistry.register(unraidlockCommand);
}
