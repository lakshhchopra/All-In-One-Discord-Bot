import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const vcroleenableCommand: Command = {
  name: "vcroleenable",
  aliases: ["vcrole enable"],
  description: "Enable the VC Role system — roles will be auto-assigned on VC join.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "vcroleenable",
  examples: ["vcroleenable"],
  execute: async (ctx) => {
    // Store enabled flag as a special whitelist entry type
    await prisma.whitelist.upsert({
      where: { guildId_targetId: { guildId: ctx.guild.id, targetId: "vcrole_system" } },
      update: { type: "vcrole_enabled", modules: ["true"] },
      create: { guildId: ctx.guild.id, targetId: "vcrole_system", type: "vcrole_enabled", modules: ["true"] }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("✅ VC Role system **enabled**. Members will receive roles when joining voice channels.", ctx.guild)] });
  }
};
