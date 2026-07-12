import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const twentyFourSevenCommand: Command = {
  name: "247",
  aliases: ["24/7"],
  description: "Toggle 24/7 music mode. If enabled, the bot won't leave the VC when the queue ends.",
  category: "Music",
  permissionLevel: "OWNER",
  usage: "247",
  execute: async (ctx: any) => {
    const musicConfig = await prisma.musicConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: {},
      create: { guildId: ctx.guild.id }
    });

    const newState = !musicConfig.twentyFourSeven;

    await prisma.musicConfig.update({
      where: { guildId: ctx.guild.id },
      data: { twentyFourSeven: newState }
    });

    if (newState) {
      return ctx.reply({ embeds: [UniversalEmbed.success("✅ **24/7 mode enabled.** I will now stay in the voice channel indefinitely.", ctx.guild)] });
    } else {
      return ctx.reply({ embeds: [UniversalEmbed.success("❌ **24/7 mode disabled.** I will automatically leave the voice channel when inactive.", ctx.guild)] });
    }
  }
};

