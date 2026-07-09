import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType } from "discord.js";

export const boostgreetCommand: Command = {
  name: "boostgreet",
  description: "Configure greetings when a member boosts the server.",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "boostgreet <enable | disable | set | show | reset | test> [value]",
  examples: [
    "boostgreet enable",
    "boostgreet set Thanks {user} for boosting!",
    "boostgreet show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "enable") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let channelId = config?.boostChannelId;
      if (!channelId) {
        const channel = ctx.guild.channels.cache.find(c =>
          (c.name.includes("boost") || c.name.includes("welcome")) &&
          c.type === ChannelType.GuildText
        );
        if (channel) channelId = channel.id;
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostChannelId: channelId },
        create: { guildId: ctx.guild.id, boostChannelId: channelId }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Boost greetings **enabled**. Active channel: <#${channelId || "Not configured"}>`, ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostChannelId: null },
        create: { guildId: ctx.guild.id, boostChannelId: null }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Boost greetings **disabled**.", ctx.guild)] });
    }

    if (action === "set") {
      const msg = ctx.args.slice(1).join(" ");
      if (!msg) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a boost message template.", ctx.guild)] }, 5);
      }

      const channel = ctx.getChannelOption("value", 1);
      if (channel) {
        const textMsg = ctx.args.slice(2).join(" ");
        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: { boostChannelId: channel.id, boostMessage: textMsg || null },
          create: { guildId: ctx.guild.id, boostChannelId: channel.id, boostMessage: textMsg || null }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Boost channel set to ${channel} and message template updated.`, ctx.guild)] });
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostMessage: msg },
        create: { guildId: ctx.guild.id, boostMessage: msg }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Boost message template set to: \`${msg}\``, ctx.guild)] });
    }

    if (action === "show") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Boost Greeting Configuration", ctx.guild)
            .setDescription(
              `- **Status:** ${config?.boostChannelId ? "🟢 Enabled" : "🔴 Disabled"}\n` +
              `- **Channel:** <#${config?.boostChannelId || "Not set"}>\n` +
              `- **Message Template:** \`${config?.boostMessage || "Thanks {user} for boosting {server}!"}\``
            )
        ]
      });
    }

    if (action === "reset") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostChannelId: null, boostMessage: null },
        create: { guildId: ctx.guild.id, boostChannelId: null, boostMessage: null }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Boost greeting configuration reset.", ctx.guild)] });
    }

    if (action === "test") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const channelId = config?.boostChannelId;
      if (!channelId) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please configure and enable boost greetings first.", ctx.guild)] }, 5);
      }

      const text = config.boostMessage || "Thanks {user} for boosting {server}!";
      const parsedText = text.replace("{user}", ctx.user.tag).replace("{server}", ctx.guild.name);

      const channel = ctx.guild.channels.cache.get(channelId);
      if (channel && "send" in channel) {
        await (channel as any).send({ content: parsedText });
        return ctx.reply({ embeds: [UniversalEmbed.success("Sent test boost greeting message.", ctx.guild)] });
      }

      return ctx.reply({ embeds: [UniversalEmbed.error("Configured boost channel is not accessible.", ctx.guild)] }, 5);
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `boostgreet [enable|disable|set|show|reset|test] [value]`", ctx.guild)] });
  }
};
