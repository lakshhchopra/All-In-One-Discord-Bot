import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../utils/duration.js";
import { drawWelcomeCard } from "../../../services/canvas.js";
import { AttachmentBuilder, ChannelType } from "discord.js";

export const greetCommand: Command = {
  name: "greet",
  description: "Configure greetings (welcome message, channel, styles, autodelete).",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "greet <enable | disable | create | channel | delete | config | style | card | autodelete | test> [value]",
  examples: [
    "greet enable",
    "greet channel #welcome",
    "greet card https://example.com/bg.png",
    "greet test"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      // Find or set welcome channel
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let channelId = config?.welcomeChannelId;
      if (!channelId) {
        // Fallback: look for a channel named welcome
        const channel = ctx.guild.channels.cache.find(c => c.name.includes("welcome") && c.type === ChannelType.GuildText);
        if (channel) channelId = channel.id;
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeDmEnabled: true, welcomeChannelId: channelId },
        create: { guildId: ctx.guild.id, welcomeDmEnabled: true, welcomeChannelId: channelId }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome greetings **enabled**. Active channel: <#${channelId || "Not configured"}>`, ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeDmEnabled: false },
        create: { guildId: ctx.guild.id, welcomeDmEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Welcome greetings **disabled**.", ctx.guild)] });
    }

    if (action === "create") {
      // Automatically create a #welcome channel
      const channel = await ctx.guild.channels.create({
        name: "welcome",
        type: ChannelType.GuildText,
        reason: "Automatic welcomer setup"
      });

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeChannelId: channel.id },
        create: { guildId: ctx.guild.id, welcomeChannelId: channel.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Created channel ${channel} and set it as welcome channel.`, ctx.guild)] });
    }

    if (action === "channel" || action === "channel set") {
      const channel = ctx.getChannelOption("channel", 1) || ctx.getChannelOption("channel", 2);
      if (!channel) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a welcome channel.", ctx.guild)] }, 5);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeChannelId: channel.id },
        create: { guildId: ctx.guild.id, welcomeChannelId: channel.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome channel set to ${channel}`, ctx.guild)] });
    }

    if (action === "channel reset" || action === "delete") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeChannelId: null },
        create: { guildId: ctx.guild.id, welcomeChannelId: null }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Welcome channel has been reset.", ctx.guild)] });
    }

    if (action === "card" || action === "style") {
      const url = ctx.getStringOption("value", 1);
      if (!url) {
        const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
        return ctx.reply({
          embeds: [
            UniversalEmbed.info("Welcome Card Style Config", ctx.guild)
              .setDescription(`- **Current Background URL:** \`${config?.welcomeImageBg || "Default"}\``)
          ]
        });
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeImageBg: url },
        create: { guildId: ctx.guild.id, welcomeImageBg: url }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome card background style updated to: \`${url}\``, ctx.guild)] });
    }

    if (action === "autodelete") {
      const raw = ctx.getStringOption("value", 1);
      if (!raw) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a duration (e.g. `10s`, `1m`).", ctx.guild)] }, 5);

      const parsed = parseDuration(raw);
      if (!parsed) return ctx.reply({ embeds: [UniversalEmbed.error(DURATION_FORMAT_ERROR, ctx.guild)] }, 5);

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeAutoDelete: parsed.seconds },
        create: { guildId: ctx.guild.id, welcomeAutoDelete: parsed.seconds }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome messages will autodelete after **${parsed.label}**.`, ctx.guild)] });
    }

    if (action === "config") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Welcomer Configuration", ctx.guild)
            .setDescription(
              `- **Enabled:** ${config?.welcomeDmEnabled ? "🟢 Yes" : "🔴 No"}\n` +
              `- **Channel:** <#${config?.welcomeChannelId || "Not set"}>\n` +
              `- **Message:** \`${config?.welcomeMessage || "Welcome {user} to {server}!"}\`\n` +
              `- **Auto Delete:** \`${config?.welcomeAutoDelete ? `${config.welcomeAutoDelete}s` : "Disabled"}\`\n` +
              `- **Card Background:** \`${config?.welcomeImageBg || "Default"}\``
            )
        ]
      });
    }

    if (action === "test") {
      await ctx.reply("⏳ Rendering welcome preview, please wait...");
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const avatarUrl = ctx.user.displayAvatarURL({ extension: "png" });
      const buffer = await drawWelcomeCard(
        avatarUrl,
        ctx.user.username,
        ctx.guild.name,
        String(ctx.guild.memberCount),
        config?.welcomeImageBg || undefined
      );
      const attachment = new AttachmentBuilder(buffer, { name: "welcome.png" });
      return ctx.reply({ content: `✅ Welcome card preview:`, files: [attachment] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `greet <enable|disable|create|channel|delete|config|style|card|autodelete|test> [value]`", ctx.guild)] });
  }
};
