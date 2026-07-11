import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../utils/duration.js";
import { parseVariables, parseObjectVariables } from "../../../services/utils/parser.js";
import { parseEmbedPlaceholder } from "../../../services/utils/placeholder.js";
import { ChannelType, EmbedBuilder } from "discord.js";

export const greetCommand: Command = {
  name: "greet",
  description: "Configure greetings (welcome message, channel, message type, autodelete).",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "greet <enable | disable | create | channel | delete | config | message | type | autodelete | test> [value]",
  examples: [
    "greet enable",
    "greet channel #welcome",
    "greet message Welcome {user} to {server}!",
    "greet type embed",
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

    if (action === "message" || action === "msg") {
      const msg = ctx.args.slice(1).join(" ");
      if (!msg) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a welcome message template. Example: `Welcome {user} to our server!`", ctx.guild)] }, 5);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeMessage: msg },
        create: { guildId: ctx.guild.id, welcomeMessage: msg }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome message template set to: \`${msg}\``, ctx.guild)] });
    }

    if (action === "type") {
      const type = ctx.getStringOption("value", 1)?.toLowerCase();
      if (!type || !["normal", "embed", "both"].includes(type)) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid welcome message type: `normal`, `embed`, or `both`.", ctx.guild)] }, 5);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeType: type } as any,
        create: { guildId: ctx.guild.id, welcomeType: type } as any
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome message type set to: **${type}**`, ctx.guild)] });
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
      const config = (await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } })) as any;
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Welcomer Configuration", ctx.guild)
            .setDescription(
              `- **Enabled:** ${config?.welcomeDmEnabled ? "🟢 Yes" : "🔴 No"}\n` +
              `- **Channel:** <#${config?.welcomeChannelId || "Not set"}>\n` +
              `- **Message:** \`${config?.welcomeMessage || "Welcome {user} to {server}!"}\`\n` +
              `- **Type:** \`${config?.welcomeType || "both"}\`\n` +
              `- **Auto Delete:** \`${config?.welcomeAutoDelete ? `${config.welcomeAutoDelete}s` : "Disabled"}\``
            )
        ]
      });
    }

    if (action === "test") {
      const config = (await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } })) as any;
      const channelId = config?.welcomeChannelId;
      if (!channelId) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please configure and enable a welcome channel first.", ctx.guild)] }, 5);
      }

      const ch = ctx.guild.channels.cache.get(channelId);
      if (!ch || !("send" in ch)) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Welcome channel is not accessible or not a text channel.", ctx.guild)] }, 5);
      }

      const template = config?.welcomeMessage || "Welcome {mention} to {server}!";
      const parsedMessage = parseVariables(template, { user: ctx.member || ctx.user, guild: ctx.guild });

      let sendPayload: any = {};

      if (parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:")) {
        const res = await parseEmbedPlaceholder(parsedMessage, ctx.guild.id);
        let embeds = res.embeds || [];
        if (embeds.length > 0) {
          embeds = embeds.map(emb => parseObjectVariables(emb, { user: ctx.member || ctx.user, guild: ctx.guild }));
        }
        sendPayload = {
          content: res.content || undefined,
          embeds
        };
      } else {
        const welcomeType = config?.welcomeType || "both";
        if (welcomeType === "normal") {
          sendPayload = { content: parsedMessage };
        } else {
          const embed = new EmbedBuilder()
            .setTitle(`Welcome to ${ctx.guild.name}!`)
            .setDescription(parsedMessage)
            .setThumbnail(ctx.user.displayAvatarURL({ extension: "png" }))
            .setColor(0x3498db)
            .setTimestamp();

          if (welcomeType === "embed") {
            sendPayload = { embeds: [embed] };
          } else {
            // both
            sendPayload = {
              content: `Welcome ${ctx.member || ctx.user}!`,
              embeds: [embed]
            };
          }
        }
      }

      await (ch as any).send(sendPayload);
      const modeText = parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:") ? "custom embed" : config?.welcomeType || "both";
      return ctx.reply({ embeds: [UniversalEmbed.success(`Sent test welcome message to <#${channelId}> (Mode: **${modeText}**).`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `greet <enable|disable|create|channel|delete|config|message|type|autodelete|test> [value]`", ctx.guild)] });
  }
};
