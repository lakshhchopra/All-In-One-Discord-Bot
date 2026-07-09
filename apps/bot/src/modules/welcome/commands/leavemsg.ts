import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType } from "discord.js";

export const leavemsgCommand: Command = {
  name: "leavemsg",
  description: "Configure leave messages when a user leaves the server.",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "leavemsg <enable | disable | set | show | reset | test> [value]",
  examples: [
    "leavemsg enable",
    "leavemsg set Good bye {user}!",
    "leavemsg show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let channelId = config?.leaveChannelId;
      if (!channelId) {
        // Fallback: look for a channel named leave or goodbye
        const channel = ctx.guild.channels.cache.find(c =>
          (c.name.includes("leave") || c.name.includes("goodbye") || c.name.includes("welcome")) &&
          c.type === ChannelType.GuildText
        );
        if (channel) channelId = channel.id;
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { leaveChannelId: channelId },
        create: { guildId: ctx.guild.id, leaveChannelId: channelId }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Leave messages **enabled**. Active channel: <#${channelId || "Not configured"}>`, ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { leaveChannelId: null },
        create: { guildId: ctx.guild.id, leaveChannelId: null }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Leave messages **disabled**.", ctx.guild)] });
    }

    if (action === "set") {
      const msg = ctx.args.slice(1).join(" ");
      if (!msg) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a leave message template. Example: `Goodbye {user}!`", ctx.guild)] }, 5);
      }

      // Check if first argument is channel
      const channel = ctx.getChannelOption("value", 1);
      if (channel) {
        const textMsg = ctx.args.slice(2).join(" ");
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { leaveChannelId: channel.id, leaveMessage: textMsg || null },
          create: { guildId: ctx.guild.id, leaveChannelId: channel.id, leaveMessage: textMsg || null }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Leave channel set to ${channel} and message template updated.`, ctx.guild)] });
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { leaveMessage: msg },
        create: { guildId: ctx.guild.id, leaveMessage: msg }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Leave message template set to: \`${msg}\``, ctx.guild)] });
    }

    if (action === "show") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Leave Message Configuration", ctx.guild)
            .setDescription(
              `- **Status:** ${config?.leaveChannelId ? "🟢 Enabled" : "🔴 Disabled"}\n` +
              `- **Channel:** <#${config?.leaveChannelId || "Not set"}>\n` +
              `- **Message Template:** \`${config?.leaveMessage || "Goodbye {user}!"}\``
            )
        ]
      });
    }

    if (action === "reset") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { leaveChannelId: null, leaveMessage: null },
        create: { guildId: ctx.guild.id, leaveChannelId: null, leaveMessage: null }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Leave message configuration reset.", ctx.guild)] });
    }

    if (action === "test") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const channelId = config?.leaveChannelId;
      if (!channelId) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please configure and enable leave messages first.", ctx.guild)] }, 5);
      }

      const text = config.leaveMessage || "Goodbye {user}!";
      const parsedText = text.replace("{user}", ctx.user.tag).replace("{server}", ctx.guild.name);

      const channel = ctx.guild.channels.cache.get(channelId);
      if (channel && "send" in channel) {
        await (channel as any).send({ content: parsedText });
        return ctx.reply({ embeds: [UniversalEmbed.success("Sent test leave message.", ctx.guild)] });
      }

      return ctx.reply({ embeds: [UniversalEmbed.error("Configured leave channel is not accessible.", ctx.guild)] }, 5);
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `leavemsg [enable|disable|set|show|reset|test] [value]`", ctx.guild)] });
  }
};
