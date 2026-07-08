import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const setCountChannelCommand: Command = {
  name: "setcountchannel",
  description: "Sets the counting game channel.",
  category: "Games",
  permissionLevel: "ADMIN",
  usage: "setcountchannel <channel>",
  examples: ["setcountchannel #counting"],
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0);
    if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a channel.", ctx.guild)] }, 5);

    await prisma.countState.upsert({
      where: { guildId: ctx.guild.id },
      update: { channelId: channel.id, currentCount: 0, lastUserId: null },
      create: { guildId: ctx.guild.id, channelId: channel.id, currentCount: 0 }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Counting channel configured to ${channel}. Reset count to \`0\`.`, ctx.guild)] });
  }
};
