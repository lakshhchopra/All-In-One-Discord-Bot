import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";

export const vcrolesetCommand: Command = {
  name: "vcroleset",
  aliases: ["vcrole set", "vcrole add"],
  description: "Assign a role to be given when a member joins a specific voice channel (or any VC).",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "vcroleset <@role> [voice-channel-id | all]",
  examples: ["vcroleset @VoiceUser all", "vcroleset @Gaming 123456789"],
  execute: async (ctx) => {
    const role = ctx.getRoleOption("role", 0);
    const targetCh = ctx.args[1] || "all";
    if (!role) return ctx.wrongUsage(vcrolesetCommand);

    await prisma.whitelist.upsert({
      where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } },
      update: { type: "vcrole", modules: [targetCh] },
      create: { guildId: ctx.guild.id, targetId: role.id, type: "vcrole", modules: [targetCh] }
    });

    return ctx.reply({
      embeds: [UniversalEmbed.success(
        `✅ **${role.name}** will be assigned when members join \`${targetCh === "all" ? "any voice channel" : `VC: ${targetCh}`}\`.`,
        ctx.guild
      )]
    });
  }
};
