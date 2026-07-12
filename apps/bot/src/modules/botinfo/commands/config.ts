import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const configCommand: Command = {
  name: "config",
  description: "View, import or export server configuration.",
  category: "Configuration",
  permissionLevel: "ADMIN",
  usage: "config [export | import <json>]",
  examples: ["config", "config export", "config import {...}"],
  execute: async (ctx: any) => {
    const sub = ctx.getStringOption("action", 0)?.toLowerCase();

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

