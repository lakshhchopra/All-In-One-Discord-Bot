import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { drawWelcomeCard, drawBoostCard } from "../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";

export const setGreetCommand: Command = {
  name: "setgreet",
  description: "Configure greetings (channel, message, autodelete).",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const option = ctx.getStringOption("type", 0); // channel, message, autodelete

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
      // Reassemble arguments for message
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
      const seconds = ctx.getIntegerOption("seconds", 1);
      if (seconds === null) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide duration in seconds.", ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { welcomeAutoDelete: seconds },
        create: { guildId: ctx.guild.id, welcomeAutoDelete: seconds }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome message autodelete set to \`${seconds}s\`.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `setgreet [channel|message|autodelete] [value]`", ctx.guild)] });
  }
};

export const setBoostCommand: Command = {
  name: "setboost",
  description: "Configure server boost greetings.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const option = ctx.getStringOption("type", 0); // channel, message

    if (option === "channel") {
      const channel = ctx.getChannelOption("channel", 1);
      if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a channel.", ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostChannelId: channel.id },
        create: { guildId: ctx.guild.id, boostChannelId: channel.id }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Boost channel set to ${channel}`, ctx.guild)] });
    }

    if (option === "message") {
      const msg = ctx.args.slice(1).join(" ");
      if (!msg) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a boost message template.", ctx.guild)] }, 5);
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { boostMessage: msg },
        create: { guildId: ctx.guild.id, boostMessage: msg }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Boost message template updated.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `setboost [channel|message] [value]`", ctx.guild)] });
  }
};

export const autoroleCommand: Command = {
  name: "autorole",
  description: "Setup auto roles for humans and bots.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // humans, bots, show, reset

    if (action === "humans") {
      const sub = ctx.getStringOption("sub", 1); // add, remove
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let roles = config?.autoRolesHumans ?? [];

      if (sub === "add") {
        if (!roles.includes(role.id)) roles.push(role.id);
      } else if (sub === "remove") {
        roles = roles.filter(r => r !== role.id);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { autoRolesHumans: roles },
        create: { guildId: ctx.guild.id, autoRolesHumans: roles }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Human autoroles updated.`, ctx.guild)] });
    }

    if (action === "bots") {
      const sub = ctx.getStringOption("sub", 1); // add, remove
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      let roles = config?.autoRolesBots ?? [];

      if (sub === "add") {
        if (!roles.includes(role.id)) roles.push(role.id);
      } else if (sub === "remove") {
        roles = roles.filter(r => r !== role.id);
      }

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { autoRolesBots: roles },
        create: { guildId: ctx.guild.id, autoRolesBots: roles }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Bot autoroles updated.`, ctx.guild)] });
    }

    if (action === "show") {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const humans = config?.autoRolesHumans.map(id => `<@&${id}>`).join(", ") || "None";
      const bots = config?.autoRolesBots.map(id => `<@&${id}>`).join(", ") || "None";

      const embed = UniversalEmbed.info("Auto Roles List", ctx.guild)
        .addFields(
          { name: "Humans Autoroles", value: humans },
          { name: "Bots Autoroles", value: bots }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { autoRolesHumans: [], autoRolesBots: [] },
        create: { guildId: ctx.guild.id, autoRolesHumans: [], autoRolesBots: [] }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Auto roles configuration reset.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `autorole [humans|bots|show|reset] [add|remove] [role]`", ctx.guild)] });
  }
};

export const testGreetCommand: Command = {
  name: "testgreet",
  description: "Test welcome greetings canvas card rendering.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    await ctx.reply("⏳ Rendering card, please wait...");
    const avatarUrl = ctx.user.displayAvatarURL({ extension: "png" });
    const buffer = await drawWelcomeCard(avatarUrl, ctx.user.username, ctx.guild.name, String(ctx.guild.memberCount));
    const attachment = new AttachmentBuilder(buffer, { name: "welcome.png" });
    return ctx.reply({ content: `✅ Welcome card preview:`, files: [attachment] });
  }
};

export const testBoostCommand: Command = {
  name: "testboost",
  description: "Test boost greetings canvas card rendering.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    await ctx.reply("⏳ Rendering card, please wait...");
    const avatarUrl = ctx.user.displayAvatarURL({ extension: "png" });
    const buffer = await drawBoostCard(avatarUrl, ctx.user.username, ctx.guild.name);
    const attachment = new AttachmentBuilder(buffer, { name: "boost.png" });
    return ctx.reply({ content: `✅ Boost card preview:`, files: [attachment] });
  }
};

export function registerWelcome() {
  CommandRegistry.register(setGreetCommand);
  CommandRegistry.register(setBoostCommand);
  CommandRegistry.register(autoroleCommand);
  CommandRegistry.register(testGreetCommand);
  CommandRegistry.register(testBoostCommand);
}
