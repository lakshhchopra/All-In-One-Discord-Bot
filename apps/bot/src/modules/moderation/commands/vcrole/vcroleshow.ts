import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";

export const vcroleShowCommand: Command = {
  name: "vcroleshow",
  aliases: ["vcrole show", "vcrole list"],
  description: "Show all configured VC Roles for this server.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "vcroleshow",
  examples: ["vcroleshow"],
  execute: async (ctx) => {
    const list = await prisma.whitelist.findMany({
      where: { guildId: ctx.guild.id, type: "vcrole" }
    });

    if (list.length === 0) {
      return ctx.reply({ embeds: [UniversalEmbed.info("No VC Roles configured. Use `vcroleset @role [vc-id|all]` to add one.", ctx.guild)] });
    }

    const desc = list.map(item =>
      `• <@&${item.targetId}> → ${item.modules[0] === "all" ? "**Any VC**" : `VC: \`${item.modules[0]}\``}`
    ).join("\n");

    return ctx.reply({
      embeds: [
        UniversalEmbed.info("📋 VC Role Configurations", ctx.guild)
          .setDescription(desc)
          .setFooter({ text: `${list.length} VC role(s) configured` })
      ]
    });
  }
};
