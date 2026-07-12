import { Command } from "../../../../../commands/types.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvclimitCommand: Command = {
  name: "limit",
  aliases: [],
  description: "Set the user limit for your TempVC",
  category: "TempVC",
  permissionLevel: "USER",
  usage: "tempvc limit <number>",
  execute: async (ctx: any) => {
    const memberVoiceChannel = ctx.member?.voice?.channel;
    if (!memberVoiceChannel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not connected to a voice channel.", ctx.guild)] }, 5);
    }

    const dbVc = await prisma.tempVC.findUnique({
      where: { channelId: memberVoiceChannel.id }
    });

    if (!dbVc) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This is not a managed temporary voice channel.", ctx.guild)] }, 5);
    }

    const isOwner = dbVc.ownerId === ctx.user.id;

    if (!isOwner) return ctx.reply({ embeds: [UniversalEmbed.error("Only the channel owner can manage this channel.", ctx.guild)] }, 5);
    const limit = ctx.getIntegerOption("limit", 0) || parseInt(ctx.args[0]);
    if (isNaN(limit) || limit < 0 || limit > 99) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid limit (0-99).", ctx.guild)] }, 5);
    }
    await (memberVoiceChannel as VoiceChannel).setUserLimit(limit);
    await prisma.tempVC.update({ where: { channelId: memberVoiceChannel.id }, data: { limit } });
    return ctx.reply({ embeds: [UniversalEmbed.success(`User limit set to **${limit}**`, ctx.guild)] });

  }
};
