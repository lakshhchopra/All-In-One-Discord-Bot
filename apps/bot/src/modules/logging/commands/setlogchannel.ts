import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const setLogChannelCommand: Command = {
  name: "setlogchannel",
  description: "Sets the logging channel.",
  category: "Logging",
  permissionLevel: "ADMIN",
  usage: "setlogchannel <channel>",
  examples: ["setlogchannel #mod-logs"],
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0);
    if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a channel.", ctx.guild)] }, 5);

    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { logChannelId: channel.id },
      create: { guildId: ctx.guild.id, logChannelId: channel.id }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Logging channel set to ${channel}`, ctx.guild)] });
  }
};
