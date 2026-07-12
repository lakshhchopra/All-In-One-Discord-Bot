import { Command } from "../../../commands/command.js";
import { TextChannel } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const unraidlockCommand: Command = {
  name: "unraidlock",
  description: "Removes server lock down.",
  category: "Anti Raid",
  permissionLevel: "ADMIN",
  usage: "unraidlock",
  examples: ["unraidlock"],
  execute: async (ctx: any) => {
    const textChannels = ctx.guild.channels.cache.filter(c => c.isTextBased() && !c.isDMBased());
    for (const [_, ch] of textChannels) {
      try {
        if (ch instanceof TextChannel) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: null });
        }
      } catch {}
    }
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { antiRaidLocked: false },
      create: { guildId: ctx.guild.id, antiRaidLocked: false }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("✅ Server unlocked. Everyone can send messages again.", ctx.guild)] });
  }
};

