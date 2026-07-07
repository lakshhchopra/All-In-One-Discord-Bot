import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { version as djsVersion } from "discord.js";

export const pingCommand: Command = {
  name: "ping",
  description: "Check bot latency.",
  category: "Information",
  execute: async (ctx) => {
    const start = Date.now();
    const replyMsg = await ctx.reply("Calculating ping...");
    const latency = Date.now() - start;
    const wsPing = ctx.guild.client.ws.ping;

    const embed = UniversalEmbed.info("Bot Latency", ctx.guild)
      .addFields(
        { name: "Message Latency", value: `\`${latency}ms\``, inline: true },
        { name: "API Websocket Latency", value: `\`${wsPing}ms\``, inline: true }
      );

    if (ctx.isInteraction) {
      await ctx.reply({ embeds: [embed] });
    } else {
      await replyMsg?.edit({ content: "", embeds: [embed] });
    }
  }
};

export const afkCommand: Command = {
  name: "afk",
  description: "Set yourself as AFK.",
  category: "Information",
  execute: async (ctx) => {
    const reason = ctx.args.join(" ") || "AFK";

    await prisma.memberStats.upsert({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: ctx.user.id } },
      update: { afkMessage: reason, afkSince: new Date() },
      create: { guildId: ctx.guild.id, userId: ctx.user.id, afkMessage: reason, afkSince: new Date() }
    });

    try {
      if (ctx.member.kickable && !ctx.member.permissions.has("Administrator")) {
        await ctx.member.setNickname(`[AFK] ${ctx.member.displayName}`);
      }
    } catch {}

    return ctx.reply({ embeds: [UniversalEmbed.success(`You are now AFK: **${reason}**`, ctx.guild)] });
  }
};

export const userinfoCommand: Command = {
  name: "userinfo",
  description: "Get detailed information about a member.",
  category: "Information",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0) || ctx.member;

    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: ctx.guild.id, userId: member.id } }
    });

    const embed = UniversalEmbed.info(`User Info: ${member.user.tag}`, ctx.guild)
      .setThumbnail(member.user.displayAvatarURL())
      .addFields(
        { name: "User ID", value: `\`${member.id}\``, inline: true },
        { name: "Nickname", value: member.nickname ?? "None", inline: true },
        { name: "Bot?", value: member.user.bot ? "Yes" : "No", inline: true },
        { name: "Created At", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: "Joined At", value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>`, inline: true },
        { name: "Messages", value: `\`${stats?.totalMessages ?? 0}\``, inline: true }
      );

    return ctx.reply({ embeds: [embed] });
  }
};

export const serverinfoCommand: Command = {
  name: "serverinfo",
  description: "Get detailed information about the server.",
  category: "Information",
  execute: async (ctx) => {
    const guild = ctx.guild;

    const embed = UniversalEmbed.info(guild.name, guild)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Server ID", value: `\`${guild.id}\``, inline: true },
        { name: "Created At", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: "Members", value: `Total: \`${guild.memberCount}\``, inline: true },
        { name: "Boosts", value: `\`${guild.premiumSubscriptionCount ?? 0}\` (Tier ${guild.premiumTier})`, inline: true }
      );

    return ctx.reply({ embeds: [embed] });
  }
};

export const avatarCommand: Command = {
  name: "avatar",
  description: "View avatar of a user.",
  category: "Information",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("user", 0) || ctx.member;
    const url = member.user.displayAvatarURL({ size: 1024 });

    const embed = UniversalEmbed.neutral(`Avatar of ${member.user.tag}`, ctx.guild)
      .setImage(url);
    return ctx.reply({ embeds: [embed] });
  }
};

export const membercountCommand: Command = {
  name: "membercount",
  description: "View detailed server member count.",
  category: "Information",
  execute: async (ctx) => {
    const total = ctx.guild.memberCount;
    const bots = ctx.guild.members.cache.filter(m => m.user.bot).size;
    const humans = total - bots;

    const embed = UniversalEmbed.info("Member Count Breakdown", ctx.guild)
      .addFields(
        { name: "Humans", value: `\`${humans}\``, inline: true },
        { name: "Bots", value: `\`${bots}\``, inline: true },
        { name: "Total", value: `\`${total}\``, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  }
};

export const botinfoCommand: Command = {
  name: "botinfo",
  description: "Get bot technical specifications.",
  category: "Information",
  execute: async (ctx) => {
    const uptime = Math.floor(ctx.guild.client.uptime! / 1000);
    const serverCount = ctx.guild.client.guilds.cache.size;

    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    const embed = UniversalEmbed.info("Technical Specifications", ctx.guild)
      .addFields(
        { name: "Servers", value: `\`${serverCount}\``, inline: true },
        { name: "Node Version", value: `\`${process.version}\``, inline: true },
        { name: "Discord.js", value: `\`v${djsVersion}\``, inline: true },
        { name: "Uptime", value: `\`${days}d ${hours}h ${minutes}m\``, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  }
};

export function registerInfo() {
  CommandRegistry.register(pingCommand);
  CommandRegistry.register(afkCommand);
  CommandRegistry.register(userinfoCommand);
  CommandRegistry.register(serverinfoCommand);
  CommandRegistry.register(avatarCommand);
  CommandRegistry.register(membercountCommand);
  CommandRegistry.register(botinfoCommand);
}
