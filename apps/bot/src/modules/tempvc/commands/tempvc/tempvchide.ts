import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvchideCommand: Command = {
  name: "hide",
  aliases: [],
  description: "Hide your TempVC",
  category: "TempVC",
  permissionLevel: "EVERYONE",
  usage: "tempvc hide",
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
    await (memberVoiceChannel as VoiceChannel).permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: false });
    await prisma.tempVC.update({ where: { channelId: memberVoiceChannel.id }, data: { hidden: true } });
    return ctx.reply({ embeds: [UniversalEmbed.success("Channel is now hidden.", ctx.guild)] });

  }
};
