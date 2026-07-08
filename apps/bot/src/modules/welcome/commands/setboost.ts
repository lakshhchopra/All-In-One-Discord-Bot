import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const setBoostCommand: Command = {
  name: "setboost",
  description: "Configure server boost greetings.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  usage: "setboost <channel | message> [value]",
  examples: [
    "setboost channel #boost-logs",
    "setboost message Thanks for boosting {user}!"
  ],
  execute: async (ctx) => {
    const option = ctx.getStringOption("type", 0)?.toLowerCase();

    if (option === "channel") {
      const channel = ctx.getChannelOption("channel", 1);
      if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a channel.", ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostChannelId: channel.id },
        create: { guildId: ctx.guild.id, boostChannelId: channel.id }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Boost channel set to ${channel}`, ctx.guild)] });
    }

    if (option === "message") {
      const msg = ctx.args.slice(1).join(" ");
      if (!msg) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a boost message template.", ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostMessage: msg },
        create: { guildId: ctx.guild.id, boostMessage: msg }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Boost message template updated.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `setboost [channel|message] [value]`", ctx.guild)] });
  }
};
