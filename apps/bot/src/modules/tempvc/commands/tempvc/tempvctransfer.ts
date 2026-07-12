import { Command } from "../../../../../commands/types.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvctransferCommand: Command = {
  name: "transfer",
  aliases: [],
  description: "Transfer ownership of your TempVC",
  category: "TempVC",
  permissionLevel: "USER",
  usage: "tempvc transfer <user>",
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
    const target = ctx.getMemberOption("member", 0) || (ctx.isInteraction ? null : ctx.source.mentions?.members?.first());
    if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to transfer ownership to.", ctx.guild)] }, 5);
    try {
      await (memberVoiceChannel as VoiceChannel).permissionOverwrites.delete(ctx.user.id);
    } catch {}
    await (memberVoiceChannel as VoiceChannel).permissionOverwrites.edit(target.id, {
      Connect: true,
      Speak: true,
      MuteMembers: true,
      DeafenMembers: true,
      MoveMembers: true
    });
    await prisma.tempVC.update({
      where: { channelId: memberVoiceChannel.id },
      data: { ownerId: target.id }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Transferred ownership to **${target.user.tag}**.`, ctx.guild)] });

  }
};
