import { Command } from "../../../../commands/command.js";
import { Message , PermissionFlagsBits } from "discord.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const stealCommand: Command = {
  name: "steal",
  description: "Steal emojis or a sticker and add them to this server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "steal <url | emojis | sticker> [name]",
  examples: ["steal <:gp_shield:1524143216222535891>", "steal sticker", "steal https://example.com/logo.png my_emoji"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageEmojisAndStickers)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Emojis and Stickers`", ctx.guild)] }, 5);
    }

    if (ctx.args.length === 0) return ctx.wrongUsage(stealCommand);

    // 1. Steal sticker
    if (ctx.args[0] === "sticker") {
      const message = ctx.source instanceof Message ? ctx.source : null;
      const repliedMsg = message?.reference ? await ctx.channel.messages.fetch(message.reference.messageId!) : null;
      const sticker = repliedMsg?.stickers.first() || message?.stickers.first();
      if (!sticker) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please reply to a message containing a sticker, or attach a sticker.", ctx.guild)] }, 5);
      }
      try {
        const created = await ctx.guild.stickers.create({
          file: sticker.url,
          name: sticker.name,
          tags: sticker.tags || "sticker"
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully stole sticker: **${created.name}**`, ctx.guild)] });
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to steal sticker. Make sure the server has free sticker slots.", ctx.guild)] }, 5);
      }
    }

    // 2. Steal multiple custom emojis from message
    const emojiRegex = /<(a?):([a-zA-Z0-9_]+):([0-9]+)>/g;
    const matches = [...ctx.args.join(" ").matchAll(emojiRegex)];

    if (matches.length > 0) {
      const results: string[] = [];
      const errors: string[] = [];

      for (const match of matches) {
        const isAnimated = match[1] === "a";
        const name = match[2];
        const id = match[3];
        const url = `https://cdn.discordapp.com/emojis/${id}.${isAnimated ? "gif" : "png"}`;

        try {
          const created = await ctx.guild.emojis.create({ attachment: url, name });
          results.push(created.toString());
        } catch {
          errors.push(name);
        }
      }

      if (results.length > 0) {
        return ctx.reply({
          embeds: [
            UniversalEmbed.success(
              `Successfully stole emojis: ${results.join(" ")}${errors.length > 0 ? `\n⚠️ Failed to steal: \`${errors.join(", ")}\`` : ""}`,
              ctx.guild
            )
          ]
        });
      } else {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Failed to steal emojis: \`${errors.join(", ")}\``, ctx.guild)] }, 5);
      }
    }

    // 3. Steal single emoji by URL
    const url = ctx.args[0];
    const name = ctx.args[1];
    if (url && (url.startsWith("http://") || url.startsWith("https://")) && name) {
      try {
        const created = await ctx.guild.emojis.create({ attachment: url, name });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully stole emoji: ${created}`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to steal emoji from URL.", ctx.guild)] }, 5);
      }
    }

    return ctx.wrongUsage(stealCommand);
  }
};
