import { Command } from "../../../../../commands/types.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvcclaimCommand: Command = {
  name: "claim",
  aliases: [],
  description: "Claim a TempVC if the owner is not in the channel",
  category: "TempVC",
  permissionLevel: "USER",
  usage: "tempvc claim",
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

    if (memberVoiceChannel.members.has(dbVc.ownerId)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("The owner is currently in this channel.", ctx.guild)] }, 5);
    }
    await prisma.tempVC.update({
      where: { channelId: memberVoiceChannel.id },
      data: { ownerId: ctx.user.id }
    });
    await (memberVoiceChannel as VoiceChannel).permissionOverwrites.edit(ctx.user.id, {
      Connect: true,
      Speak: true,
      MuteMembers: true,
      DeafenMembers: true,
      MoveMembers: true
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("You have claimed ownership of this channel.", ctx.guild)] });

  }
};
