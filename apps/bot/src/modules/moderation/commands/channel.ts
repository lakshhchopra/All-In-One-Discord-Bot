import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { isWhitelisted } from "../../../utils/security.js";
import { PermissionFlagsBits, ChannelType, TextChannel, CategoryChannel } from "discord.js";
import { parseDuration } from "../../../utils/duration.js";
import { prisma } from "../../../services/db.js";

export const channelCommand: Command = {
  name: "channel",
  description: "Manage server channels: create, delete, rename, transfer, deleteafter.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  aliases: [],
  usage: "channel <create|delete|rename|transfer|deleteafter> [options]",
  examples: [
    "channel create text announcements",
    "channel create voice Gaming",
    "channel delete #old-channel",
    "channel rename #general main-chat",
    "channel transfer #general @member",
    "channel deleteafter #temp 30m"
  ],
  execute: async (ctx) => {
    const allowed = await isWhitelisted(ctx.guild, ctx.user.id, "channel");
    if (!allowed) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not authorized to manage channels.", ctx.guild)] }, 5);
    }

    const sub = ctx.getStringOption("subcommand", 0)?.toLowerCase();

    // --- CREATE ---
    if (sub === "create") {
      const typeArg = ctx.getStringOption("type", 1)?.toLowerCase();
      const name = ctx.args.slice(2).join("-").replace(/\s+/g, "-") || "new-channel";

      const isVoice = typeArg === "voice" || typeArg === "vc";
      const channelType = isVoice ? ChannelType.GuildVoice : ChannelType.GuildText;

      try {
        const created = await ctx.guild.channels.create({
          name,
          type: channelType,
          reason: `Channel created by ${ctx.user.tag}`
        });
        return ctx.reply({
          embeds: [UniversalEmbed.success(`✅ Created ${isVoice ? "voice" : "text"} channel ${created}`, ctx.guild)]
        });
      } catch (e: any) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Failed to create channel: ${e.message}`, ctx.guild)] }, 5);
      }
    }

    // --- DELETE ---
    if (sub === "delete") {
      const ch = ctx.getChannelOption("channel", 1) || ctx.channel;
      const target = ctx.guild.channels.cache.get((ch as any).id);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Channel not found.", ctx.guild)] }, 5);

      const name = (target as any).name || target.id;
      await target.delete(`Deleted by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🗑️ Deleted channel **${name}**.`, ctx.guild)] });
    }

    // --- RENAME ---
    if (sub === "rename") {
      const ch = ctx.getChannelOption("channel", 1);
      const newName = ctx.args.slice(2).join("-").replace(/\s+/g, "-");

      if (!ch || !newName) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `channel rename #channel new-name`", ctx.guild)] }, 5);
      }

      const target = ctx.guild.channels.cache.get((ch as any).id);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Channel not found.", ctx.guild)] }, 5);

      await (target as TextChannel).setName(newName, `Renamed by ${ctx.user.tag}`);
      return ctx.reply({
        embeds: [UniversalEmbed.success(`✏️ Renamed channel to **${newName}**.`, ctx.guild)]
      });
    }

    // --- TRANSFER (change ownership/parent category) ---
    if (sub === "transfer") {
      const ch = ctx.getChannelOption("channel", 1);
      const category = ctx.args[2];

      if (!ch || !category) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `channel transfer #channel <category-id>`", ctx.guild)] }, 5);
      }

      const target = ctx.guild.channels.cache.get((ch as any).id);
      const cat = ctx.guild.channels.cache.get(category) as CategoryChannel | undefined;

      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Channel not found.", ctx.guild)] }, 5);
      if (!cat || cat.type !== ChannelType.GuildCategory) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Invalid category ID.", ctx.guild)] }, 5);
      }

      await (target as TextChannel).setParent(cat.id, { reason: `Transferred by ${ctx.user.tag}` });
      return ctx.reply({
        embeds: [UniversalEmbed.success(`📂 Moved ${target} to category **${cat.name}**.`, ctx.guild)]
      });
    }

    // --- DELETEAFTER ---
    if (sub === "deleteafter") {
      const ch = ctx.getChannelOption("channel", 1) || ctx.channel;
      const durationStr = ctx.getStringOption("duration", 2);

      if (!durationStr) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `channel deleteafter #channel <duration>`", ctx.guild)] }, 5);
      }

      const parsed = parseDuration(durationStr);
      if (!parsed) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Invalid duration. Examples: `30m`, `1h`, `2d`", ctx.guild)] }, 5);
      }

      const target = ctx.guild.channels.cache.get((ch as any).id);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Channel not found.", ctx.guild)] }, 5);

      await ctx.reply({
        embeds: [UniversalEmbed.success(`⏳ Channel ${target} will be deleted in **${parsed.label}**.`, ctx.guild)]
      });

      setTimeout(async () => {
        try {
          await target.delete(`Auto-delete after ${parsed.label} — set by ${ctx.user.tag}`);
        } catch {}
      }, parsed.ms);
      return;
    }

    return ctx.reply({
      embeds: [UniversalEmbed.info(
        "**Channel Management**\n" +
        "`channel create <text|voice> <name>`\n" +
        "`channel delete [#channel]`\n" +
        "`channel rename #channel <new-name>`\n" +
        "`channel transfer #channel <category-id>`\n" +
        "`channel deleteafter #channel <duration>`",
        ctx.guild
      )]
    });
  }
};
