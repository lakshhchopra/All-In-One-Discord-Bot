import { Command } from "../../../../../commands/types.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvcunlockCommand: Command = {
  name: "unlock",
  aliases: [],
  description: "Unlock your TempVC",
  category: "TempVC",
  permissionLevel: "USER",
  usage: "tempvc unlock",
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
    await (memberVoiceChannel as VoiceChannel).permissionOverwrites.edit(ctx.guild.roles.everyone, { Connect: null });
    await prisma.tempVC.update({ where: { channelId: memberVoiceChannel.id }, data: { locked: false } });
    return ctx.reply({ embeds: [UniversalEmbed.success("Channel unlocked for everyone.", ctx.guild)] });

  }
};
