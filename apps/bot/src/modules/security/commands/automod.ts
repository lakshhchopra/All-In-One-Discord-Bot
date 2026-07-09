import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const automodCommand: Command = {
  name: "automod",
  description: "Configure Automod system settings and whitelists.",
  category: "Antinuke & Automod",
  permissionLevel: "OWNER",
  usage: "automod <enable | disable | settings | whitelist | wlshow | reset | logging | manage> [value]",
  examples: [
    "automod enable",
    "automod disable",
    "automod wlshow",
    "automod whitelist @member"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { automodEnabled: true },
        create: { guildId: ctx.guild.id, automodEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Automod system has been **enabled**.", ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { automodEnabled: false },
        create: { guildId: ctx.guild.id, automodEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Automod system has been **disabled**.", ctx.guild)] });
    }

    if (action === "whitelist") {
      const target = ctx.getMemberOption("member", 1) || ctx.getRoleOption("role", 1);
      if (!target) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please mention a member or role to whitelist.", ctx.guild)] }, 5);
      }

      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const wlList = config?.automodWhitelist || [];
      if (!wlList.includes(target.id)) {
        wlList.push(target.id);
      }

      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { automodWhitelist: wlList }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${target.id}** to Automod whitelist.`, ctx.guild)] });
    }

    if (action === "wlshow") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const wlList = config?.automodWhitelist || [];
      const description = wlList.map(id => `<@${id}> (or Role: <@&${id}>)`).join("\n") || "No one whitelisted.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Automod Whitelisted Users/Roles", ctx.guild).setDescription(description)] });
    }

    if (action === "reset") {
      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { automodWhitelist: [] }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Automod settings and whitelist have been reset.", ctx.guild)] });
    }

    if (action === "settings" || action === "logging" || action === "manage") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Automod Settings & Configurations", ctx.guild)
            .setDescription(
              `- **Status:** ${config?.automodEnabled ? "🟢 Enabled" : "🔴 Disabled"}\n` +
              `- **Logs Channel:** <#${config?.logChannelId || "Not set"}>\n` +
              `- **Whitelist Users/Roles:** ${config?.automodWhitelist.length || 0} configured.`
            )
        ]
      });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `automod [enable | disable | settings | whitelist | wlshow | reset | logging | manage] [value]`", ctx.guild)] });
  }
};
