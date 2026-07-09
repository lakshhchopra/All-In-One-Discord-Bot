import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const vcrolereset: Command = {
  name: "vcrolereset",
  aliases: ["vcrole reset"],
  description: "Remove all VC Role configurations for this server.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "vcrolereset",
  examples: ["vcrolereset"],
  execute: async (ctx) => {
    const deleted = await prisma.whitelist.deleteMany({
      where: { guildId: ctx.guild.id, type: "vcrole" }
    });
    return ctx.reply({
      embeds: [UniversalEmbed.success(`✅ Reset **${deleted.count}** VC Role configuration(s).`, ctx.guild)]
    });
  }
};
