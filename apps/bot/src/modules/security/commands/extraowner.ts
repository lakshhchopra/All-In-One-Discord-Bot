import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const extraownerCommand: Command = {
  name: "extraowner",
  description: "Configure Extra Owners for full bypass control.",
  category: "Security",
  permissionLevel: "OWNER",
  usage: "extraowner <add | remove | show | reset> [member]",
  examples: [
    "extraowner add @member",
    "extraowner remove @member",
    "extraowner show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const member = ctx.getMemberOption("member", 1);
      if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user.", ctx.guild)] }, 5);

      await prisma.extraOwner.upsert({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: member.id } },
        update: {},
        create: { guildId: ctx.guild.id, userId: member.id }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${member.user.tag}** to Extra Owners.`, ctx.guild)] });
    }

    if (action === "remove") {
      const member = ctx.getMemberOption("member", 1);
      if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user.", ctx.guild)] }, 5);

      try {
        await prisma.extraOwner.delete({
          where: { guildId_userId: { guildId: ctx.guild.id, userId: member.id } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${member.user.tag}** from Extra Owners.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("User is not an Extra Owner.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const list = await prisma.extraOwner.findMany({ where: { guildId: ctx.guild.id } });
      const owners = list.map(o => `<@${o.userId}>`).join(", ") || "None";
      return ctx.reply({ embeds: [UniversalEmbed.info("Extra Owners", ctx.guild).setDescription(owners)] });
    }

    if (action === "reset") {
      await prisma.extraOwner.deleteMany({ where: { guildId: ctx.guild.id } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Extra Owners list reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `extraowner [add|remove|show|reset] [member]`", ctx.guild)] });
  }
};
