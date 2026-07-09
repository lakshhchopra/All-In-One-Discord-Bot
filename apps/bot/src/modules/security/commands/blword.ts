import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const blwordCommand: Command = {
  name: "blword",
  description: "Configure server word blacklists.",
  category: "Antinuke & Automod",
  permissionLevel: "OWNER",
  usage: "blword <add | show | remove | reset | guide> [word]",
  examples: [
    "blword add badword",
    "blword remove badword",
    "blword show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const word = ctx.getStringOption("word", 1)?.toLowerCase().trim();
      if (!word) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a word to blacklist.", ctx.guild)] }, 5);
      }

      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const currentList = config?.blacklistedWords || [];
      if (!currentList.includes(word)) {
        currentList.push(word);
      }

      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { blacklistedWords: currentList }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${word}** to blacklisted words list.`, ctx.guild)] });
    }

    if (action === "remove") {
      const word = ctx.getStringOption("word", 1)?.toLowerCase().trim();
      if (!word) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a word to remove.", ctx.guild)] }, 5);
      }

      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const currentList = config?.blacklistedWords || [];
      const index = currentList.indexOf(word);
      if (index > -1) {
        currentList.splice(index, 1);
      }

      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { blacklistedWords: currentList }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${word}** from blacklisted words.`, ctx.guild)] });
    }

    if (action === "show") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const list = config?.blacklistedWords || [];
      const description = list.map(w => `• \`${w}\``).join("\n") || "No blacklisted words configured.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Blacklisted Words", ctx.guild).setDescription(description)] });
    }

    if (action === "reset") {
      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { blacklistedWords: [] }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Blacklisted words list reset.", ctx.guild)] });
    }

    if (action === "guide") {
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Word Blacklist Guide", ctx.guild)
            .setDescription(
              "Allows admins to censor and delete messages containing specific terms.\n\n" +
              "- `blword add <word>`: Add a word to the blacklist.\n" +
              "- `blword remove <word>`: Remove a word from the blacklist.\n" +
              "- `blword show`: Show all blacklisted words.\n" +
              "- `blword reset`: Clear the word blacklist."
            )
        ]
      });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `blword [add | show | remove | reset | guide] [word]`", ctx.guild)] });
  }
};
