import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";

export const vcroledisableCommand: Command = {
  name: "vcroledisable",
  aliases: ["vcrole disable"],
  description: "Disable the VC Role system — roles will no longer be auto-assigned on VC join.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "vcroledisable",
  examples: ["vcroledisable"],
  execute: async (ctx) => {
    await prisma.whitelist.upsert({
      where: { guildId_targetId: { guildId: ctx.guild.id, targetId: "vcrole_system" } },
      update: { type: "vcrole_enabled", modules: ["false"] },
      create: { guildId: ctx.guild.id, targetId: "vcrole_system", type: "vcrole_enabled", modules: ["false"] }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("✅ VC Role system **disabled**.", ctx.guild)] });
  }
};
