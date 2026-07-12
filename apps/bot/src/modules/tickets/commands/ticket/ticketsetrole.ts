import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { ApplicationCommandOptionType } from "discord.js";

export const ticketsetroleCommand: Command = {
  name: "ticketsetrole",
  aliases: ["ticket setrole", "ticket support"],
  description: "Set the support team role for tickets.",
  category: "Ticket",
  permissionLevel: "ADMIN",
  usage: "ticket setrole <@role>",
  execute: async (ctx: any) => {
    const role = ctx.getRoleOption("role", 0) || (ctx.isInteraction ? null : (ctx.source as any).mentions?.roles?.first());
    if (!role) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify/mention a support role.", ctx.guild)] }, 5);
    }

    await (prisma as any).ticketConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { supportRoleId: role.id },
      create: { guildId: ctx.guild.id, supportRoleId: role.id }
    });

    return ctx.reply({
      embeds: [
        UniversalEmbed.success(`Support team role set to **${role.name}** (${role.id}).`, ctx.guild)
      ]
    });
  }
};

