import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { VoiceChannel } from "discord.js";

export const tempvcregionCommand: Command = {
  name: "region",
  aliases: [],
  description: "Change the RTC region of your TempVC",
  category: "TempVC",
  permissionLevel: "EVERYONE",
  usage: "tempvc region <region>",
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
    const region = (ctx.getStringOption("region", 0) || ctx.args[0])?.toLowerCase();
    if (!region) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a region (automatic, us-east, us-west, Europe, India, Singapore).", ctx.guild)] }, 5);
    const rtcRegion = region === "automatic" ? null : region;
    await (memberVoiceChannel as VoiceChannel).setRTCRegion(rtcRegion);
    return ctx.reply({ embeds: [UniversalEmbed.success(`RTC region successfully set to **${region}**`, ctx.guild)] });

  }
};
