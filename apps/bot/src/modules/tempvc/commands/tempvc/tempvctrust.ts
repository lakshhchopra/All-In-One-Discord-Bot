import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvctrustCommand: Command = {
  name: "trust",
  aliases: [],
  description: "Trust a user to join your locked TempVC",
  category: "TempVC",
  permissionLevel: "EVERYONE",
  usage: "tempvc trust <user>",
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
    if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to trust.", ctx.guild)] }, 5);
    await (memberVoiceChannel as VoiceChannel).permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });
    const trustedList = [...(dbVc.trusted ?? []), target.id];
    await prisma.tempVC.update({
      where: { channelId: memberVoiceChannel.id },
      data: { trusted: trustedList }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Trusted **${target.user.tag}** for this channel.`, ctx.guild)] });

  }
};
