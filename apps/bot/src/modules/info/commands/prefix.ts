import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const prefixCommand: Command = {
  name: "prefix",
  description: "Configure and manage custom command prefix for this server.",
  category: "Bot Info",
  permissionLevel: "ADMIN",
  usage: "prefix <set | reset | add | show | remove> [value]",
  examples: [
    "prefix set !",
    "prefix show",
    "prefix reset"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "set" || action === "add") {
      const val = ctx.getStringOption("value", 1);
      if (!val) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a new prefix.", ctx.guild)] }, 5);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { prefix: val },
        create: { guildId: ctx.guild.id, prefix: val }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Server prefix updated to \`${val}\``, ctx.guild)] });
    }

    if (action === "reset" || action === "remove") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { prefix: "-" },
        create: { guildId: ctx.guild.id, prefix: "-" }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Server prefix reset to default: `-`", ctx.guild)] });
    }

    if (action === "show" || !action) {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const current = config?.prefix || "-";
      return ctx.reply({ embeds: [UniversalEmbed.info("Server Prefix Status", ctx.guild).setDescription(`Current prefix: \`${current}\``)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `prefix [set|reset|add|show|remove] [value]`", ctx.guild)] });
  }
};
