import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const noprefixCommand: Command = {
  name: "noprefix",
  description: "Allow specific users to use bot commands without any prefix.",
  category: "Bot Info",
  permissionLevel: "OWNER",
  usage: "noprefix <enable | disable> <member>",
  examples: [
    "noprefix enable @member",
    "noprefix disable @member"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();
    const member = ctx.getMemberOption("member", 1);

    if (!action || !member) {
      return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `noprefix <enable | disable> <member>`", ctx.guild)] });
    }

    if (action === "enable") {
      await prisma.whitelist.upsert({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId: member.id } },
        update: { type: "noprefix" },
        create: { guildId: ctx.guild.id, targetId: member.id, type: "noprefix" }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Enabled **no-prefix** mode for **${member.user.tag}**.`, ctx.guild)] });
    }

    if (action === "disable") {
      try {
        await prisma.whitelist.delete({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: member.id } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Disabled **no-prefix** mode for **${member.user.tag}**.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("User does not have no-prefix mode enabled.", ctx.guild)] }, 5);
      }
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `noprefix <enable | disable> <member>`", ctx.guild)] });
  }
};
