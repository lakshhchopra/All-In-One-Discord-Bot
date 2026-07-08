import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../utils/duration.js";

export const setGreetCommand: Command = {
  name: "setgreet",
  description: "Configure greetings (channel, message, autodelete).",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  usage: "setgreet <channel | message | autodelete> [value]",
  examples: [
    "setgreet channel #welcome",
    "setgreet message Welcome {user} to {server}!",
    "setgreet autodelete 30s",
    "setgreet autodelete 2m"
  ],
  execute: async (ctx) => {
    const option = ctx.getStringOption("type", 0)?.toLowerCase();

    if (option === "channel") {
      const channel = ctx.getChannelOption("channel", 1);
      if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a channel.", ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeChannelId: channel.id },
        create: { guildId: ctx.guild.id, welcomeChannelId: channel.id }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome channel set to ${channel}`, ctx.guild)] });
    }

    if (option === "message") {
      const msg = ctx.args.slice(1).join(" ");
      if (!msg) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a welcome message template.", ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeMessage: msg },
        create: { guildId: ctx.guild.id, welcomeMessage: msg }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome message template updated.`, ctx.guild)] });
    }

    if (option === "autodelete") {
      const raw = ctx.getStringOption("duration", 1);
      if (!raw) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a duration. Examples: `30s`, `1m`, `2h`", ctx.guild)] }, 5);
      const parsed = parseDuration(raw);
      if (!parsed) return ctx.reply({ embeds: [UniversalEmbed.error(DURATION_FORMAT_ERROR, ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeAutoDelete: parsed.seconds },
        create: { guildId: ctx.guild.id, welcomeAutoDelete: parsed.seconds }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome message autodelete set to **${parsed.label}**.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `setgreet [channel|message|autodelete] [value]`", ctx.guild)] });
  }
};
