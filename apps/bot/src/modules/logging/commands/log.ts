import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { LogCategory, LOG_CATEGORIES, resolveLogCategory, getLoggingConfigPayload } from "../../../services/logger.js";

export const logCommand: Command = {
  name: "logging",
  description: "Configure modular activity logging settings.",
  category: "Loggings",
  aliases: ["log", "loggings"],
  usage: "logging <enable | disable | channel | config | info> [category] [channel]",
  examples: [
    "logging enable",
    "logging disable",
    "logging channel invites #invite-logs",
    "logging messages disable",
    "logging config",
    "logging info"
  ],
  execute: async (ctx: any) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Logging System Help", ctx.guild)
        .setDescription(
          `• \`logging enable\` - Globally enable logging.\n` +
          `• \`logging disable\` - Globally disable logging.\n` +
          `• \`logging channel <category> <#channel>\` - Set a custom channel for a category.\n` +
          `• \`logging <category> <enable | disable>\` - Toggle logging for a specific category.\n` +
          `• \`logging config\` - Show current toggles and channels config.\n` +
          `• \`logging info\` - Show list of all available logging categories.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
    const logData = (config?.logToggles as any) || {};
    const toggles = logData.toggles || {};
    const channels = logData.channels || {};

    if (action === "enable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logEnabled: true },
        create: { guildId: ctx.guild.id, logEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Global logging system enabled successfully.", ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logEnabled: false },
        create: { guildId: ctx.guild.id, logEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Global logging system disabled successfully.", ctx.guild)] });
    }

    // Bind custom channel to a category
    if (action === "channel" || action === "setchannel" || action === "setctchannel") {
      const catInput = ctx.getStringOption("category", 1);
      const channel = ctx.getChannelOption("channel", 2);

      if (!catInput || !channel) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `logging channel <category> <#channel>`", ctx.guild)] }, 5);
      }

      const category = resolveLogCategory(catInput);
      if (!category) {
        return ctx.reply({
          embeds: [
            UniversalEmbed.error(
              `Invalid logging category **"${catInput}"**.\n` +
              `Valid categories are: \`${LOG_CATEGORIES.join("`, `")}\`.\n` +
              `*(We match aliases like vc, msg, member, join, mod, etc. automatically!)*`,
              ctx.guild
            )
          ]
        }, 8);
      }

      channels[category] = channel.id;
      const updatedLogToggles = { toggles, channels };

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles: updatedLogToggles },
        create: { guildId: ctx.guild.id, logToggles: updatedLogToggles }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Custom logging channel for **${category}** set to ${channel}.`, ctx.guild)] });
    }

    if (action === "config") {
      const payload = await getLoggingConfigPayload(ctx.guild);
      return ctx.reply(payload);
    }

    if (action === "info" || action === "list") {
      const embed = UniversalEmbed.info("ℹ️ Logging Categories Info", ctx.guild)
        .setDescription(
          `Below is the simplified list of activity logging categories:\n` +
          `• **\`messages\`** - Message edits and deletion activity logs. *(Alias: msg, msgs)*\n` +
          `• **\`invites\`** - Invites created, deleted, and detailed join-invites stats. *(Alias: invite, inv)*\n` +
          `• **\`users\`** - Member joins, leaves, nick/profile edits, and role changes. *(Alias: member, join, leave)*\n` +
          `• **\`voice\`** - Voice connects, disconnects, and switches. *(Alias: vc)*\n` +
          `• **\`channels\`** - Channel creations, deletions, and name/topic changes. *(Alias: channel, thread)*\n` +
          `• **\`roles\`** - Role creation, deletion, and permission updates. *(Alias: role)*\n` +
          `• **\`moderation\`** - Kick, ban, timeout, and warn logs. *(Alias: mod, ban, kick)*\n` +
          `• **\`automod\`** - Custom word blacklist and Discord auto-moderation triggers.\n` +
          `• **\`emojis\`** - Custom emojis and stickers added, updated, or removed.\n` +
          `• **\`server\`** - Server settings, vanity URLs, and integration edits.`
        );
      return ctx.reply({ embeds: [embed] });
    }

    // Toggle specific category
    const category = resolveLogCategory(action);
    if (category) {
      const subAction = ctx.getStringOption("action", 1)?.toLowerCase(); // enable or disable
      if (subAction !== "enable" && subAction !== "disable") {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Usage: \`logging ${action} <enable | disable>\``, ctx.guild)] }, 5);
      }

      toggles[category] = subAction === "enable";
      const updatedLogToggles = { toggles, channels };

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles: updatedLogToggles },
        create: { guildId: ctx.guild.id, logToggles: updatedLogToggles }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Logging for category **${category}** has been **${subAction}d**`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown option or category \`${action}\`. Type \`logging\` for options.`, ctx.guild)] }, 5);
  }
};

