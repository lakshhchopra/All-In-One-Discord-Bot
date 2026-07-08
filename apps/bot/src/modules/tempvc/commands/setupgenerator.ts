import { Command } from "../../../commands/command.js";
import { VoiceChannel, ChannelType } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const setupGeneratorCommand: Command = {
  name: "setupgenerator",
  description: "Sets up a voice generator channel for Temp VC.",
  category: "Temporary Voice",
  permissionLevel: "ADMIN",
  usage: "setupgenerator <channel>",
  examples: ["setupgenerator #Create-Channel"],
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0) as VoiceChannel;
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid Voice Channel.", ctx.guild)] }, 5);
    }

    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: {
        tempVcGeneratorId: channel.id,
        tempVcCategoryId: channel.parentId
      },
      create: {
        guildId: ctx.guild.id,
        tempVcGeneratorId: channel.id,
        tempVcCategoryId: channel.parentId
      }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Temp VC Generator channel set to **${channel.name}**`, ctx.guild)] });
  }
};
