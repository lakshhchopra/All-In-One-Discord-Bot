import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvckickCommand: Command = {
  name: "kick",
  aliases: ["remove"],
  description: "Kick a user from your TempVC",
  category: "TempVC",
  permissionLevel: "EVERYONE",
  usage: "tempvc kick <user>",
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
    if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to kick from VC.", ctx.guild)] }, 5);
    if (target.voice?.channelId !== memberVoiceChannel.id) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This user is not in your channel.", ctx.guild)] }, 5);
    }
    await target.voice.disconnect("Kicked by channel owner");
    return ctx.reply({ embeds: [UniversalEmbed.success(`Kicked **${target.user.tag}** from channel.`, ctx.guild)] });

  }
};
