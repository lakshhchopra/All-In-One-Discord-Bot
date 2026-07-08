import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const setPrefixCommand: Command = {
  name: "setprefix",
  description: "Sets the bot prefix for the server.",
  category: "Configuration",
  permissionLevel: "ADMIN",
  usage: "setprefix <new_prefix>",
  examples: ["setprefix !", "setprefix >>"],
  execute: async (ctx) => {
    const newPrefix = ctx.getStringOption("prefix", 0);
    if (!newPrefix) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a new prefix.", ctx.guild)] }, 5);
    }

    if (newPrefix.length > 5) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Prefix length cannot exceed 5 characters.", ctx.guild)] }, 5);
    }

    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { prefix: newPrefix },
      create: { guildId: ctx.guild.id, prefix: newPrefix }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Prefix has been successfully set to \`${newPrefix}\``, ctx.guild)] });
  }
};
