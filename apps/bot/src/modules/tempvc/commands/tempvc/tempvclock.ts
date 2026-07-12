import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvclockCommand: Command = {
  name: "lock",
  aliases: [],
  description: "Lock your TempVC",
  category: "TempVC",
  permissionLevel: "EVERYONE",
  usage: "tempvc lock",
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
    await (memberVoiceChannel as VoiceChannel).permissionOverwrites.edit(ctx.guild.roles.everyone, { Connect: false });
    await prisma.tempVC.update({ where: { channelId: memberVoiceChannel.id }, data: { locked: true } });
    return ctx.reply({ embeds: [UniversalEmbed.success("Channel locked. Only trusted users can connect.", ctx.guild)] });

  }
};
