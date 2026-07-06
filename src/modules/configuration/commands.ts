import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";

export const setPrefixCommand: Command = {
  name: "setprefix",
  description: "Sets the bot prefix for the server.",
  category: "Configuration",
  permissionLevel: "ADMIN",
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

export const configCommand: Command = {
  name: "config",
  description: "View, import or export server configuration.",
  category: "Configuration",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const sub = ctx.getStringOption("action", 0);

    if (sub === "export") {
      const data = await prisma.guildConfig.findUnique({
        where: { guildId: ctx.guild.id }
      });
      if (!data) {
        return ctx.reply({ embeds: [UniversalEmbed.error("No configuration found to export.", ctx.guild)] });
      }
      return ctx.reply({
        content: `Here is your exported configuration. Copy and save this backup string:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
      });
    }

    if (sub === "import") {
      const importJson = ctx.getStringOption("data", 1);
      if (!importJson) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please provide the JSON string to import.", ctx.guild)] }, 5);
      }

      try {
        const parsed = JSON.parse(importJson);
        // Ensure we don't import random server settings
        delete parsed.guildId;
        delete parsed.createdAt;
        delete parsed.updatedAt;

        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: parsed,
          create: { guildId: ctx.guild.id, ...parsed }
        });

        return ctx.reply({ embeds: [UniversalEmbed.success("Configuration imported successfully.", ctx.guild)] });
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to parse the configuration. Ensure it's valid JSON.", ctx.guild)] });
      }
    }

    // View Config
    const data = await prisma.guildConfig.findUnique({
      where: { guildId: ctx.guild.id }
    });

    const embed = UniversalEmbed.info("Server Configuration Settings", ctx.guild)
      .addFields(
        { name: "Prefix", value: `\`${data?.prefix ?? "-"}\``, inline: true },
        { name: "Language", value: `\`${data?.language ?? "en"}\``, inline: true },
        { name: "Timezone", value: `\`${data?.timezone ?? "UTC"}\``, inline: true },
        { name: "Welcomer Channel", value: data?.welcomeChannelId ? `<#${data.welcomeChannelId}>` : "Not Configured", inline: true },
        { name: "Logging Enabled", value: data?.logEnabled ? "Yes" : "No", inline: true },
        { name: "Anti-Raid", value: data?.antiRaidEnabled ? "Active" : "Disabled", inline: true },
        { name: "Anti-Nuke", value: data?.antiNukeEnabled ? "Active" : "Disabled", inline: true }
      );

    return ctx.reply({ embeds: [embed] });
  }
};

export const helpCommand: Command = {
  name: "help",
  description: "Displays available commands.",
  category: "Configuration",
  execute: async (ctx) => {
    const targetCmd = ctx.getStringOption("command", 0);

    if (targetCmd) {
      const command = CommandRegistry.get(targetCmd);
      if (!command) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Command \`${targetCmd}\` not found.`, ctx.guild)] }, 5);
      }

      const embed = UniversalEmbed.info(`Help for command: \`${command.name}\``, ctx.guild)
        .addFields(
          { name: "Description", value: command.description },
          { name: "Category", value: command.category, inline: true },
          { name: "Aliases", value: command.aliases?.join(", ") || "None", inline: true },
          { name: "Cooldown", value: `${command.cooldown ?? 3}s`, inline: true }
        );
      return ctx.reply({ embeds: [embed] });
    }

    // Categorized command list
    const commands = CommandRegistry.getAll();
    const categories: Record<string, string[]> = {};

    for (const cmd of commands) {
      if (!categories[cmd.category]) {
        categories[cmd.category] = [];
      }
      categories[cmd.category].push(cmd.name);
    }

    const embed = UniversalEmbed.info("Bot Help Panel", ctx.guild);
    for (const [cat, cmds] of Object.entries(categories)) {
      embed.addFields({ name: cat, value: cmds.map(c => `\`${c}\``).join(", ") });
    }

    return ctx.reply({ embeds: [embed] });
  }
};

export function registerConfiguration() {
  CommandRegistry.register(setPrefixCommand);
  CommandRegistry.register(configCommand);
  CommandRegistry.register(helpCommand);
}
