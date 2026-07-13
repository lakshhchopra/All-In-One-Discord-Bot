import { Command } from "../../../commands/command.js";
import { TextChannel } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const raidlockCommand: Command = {
  name: "raidlock",
  description: "Locks down the server to prevent any messages.",
  category: "Anti Raid",
  permissionLevel: "ADMIN",
  usage: "raidlock",
  examples: ["raidlock"],
  execute: async (ctx: any) => {
    const textChannels = ctx.guild.channels.cache.filter((c: any) => c.isTextBased() && !c.isDMBased());
    for (const [_, ch] of textChannels) {
      try {
        if (ch instanceof TextChannel) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
        }
      } catch {}
    }
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { antiRaidLocked: true },
      create: { guildId: ctx.guild.id, antiRaidLocked: true }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("🚨 Server locked down. All channels locked from sending messages.", ctx.guild)] });
  }
};

