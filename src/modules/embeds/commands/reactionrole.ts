import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const reactionroleCommand: Command = {
  name: "reactionrole",
  description: "Configure reaction roles.",
  category: "Extras",
  permissionLevel: "ADMIN",
  usage: "reactionrole <add | remove | list> [messageId] [emoji] [role]",
  examples: [
    "reactionrole add 1135816865055256688 :smile: @Member",
    "reactionrole remove 1135816865055256688 :smile: @Member",
    "reactionrole list"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const messageId = ctx.getStringOption("messageId", 1);
      const emoji = ctx.getStringOption("emoji", 2);
      const role = ctx.getRoleOption("role", 3);

      if (!messageId || !emoji || !role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `reactionrole add <messageId> <emoji> <role>`", ctx.guild)] }, 5);
      }

      await prisma.reactionRole.create({
        data: {
          guildId: ctx.guild.id,
          channelId: ctx.channel.id,
          messageId,
          emoji,
          roleId: role.id
        }
      });

      // Try to react to the message
      try {
        const msg = await ctx.channel.messages.fetch(messageId);
        await msg.react(emoji);
      } catch {}

      return ctx.reply({ embeds: [UniversalEmbed.success(`Reaction role mapped successfully on message **${messageId}**`, ctx.guild)] });
    }

    if (action === "remove") {
      const messageId = ctx.getStringOption("messageId", 1);
      const emoji = ctx.getStringOption("emoji", 2);
      const role = ctx.getRoleOption("role", 3);

      if (!messageId || !emoji || !role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `reactionrole remove <messageId> <emoji> <role>`", ctx.guild)] }, 5);
      }

      try {
        await prisma.reactionRole.delete({
          where: {
            messageId_emoji_roleId: { messageId, emoji, roleId: role.id }
          }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Reaction role mapping removed.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Reaction role mapping not found.", ctx.guild)] }, 5);
      }
    }

    if (action === "list") {
      const list = await prisma.reactionRole.findMany({ where: { guildId: ctx.guild.id } });
      const rrList = list.map(item => `• Message: [${item.messageId}](https://discord.com/channels/${ctx.guild.id}/${item.channelId}/${item.messageId}) | Emoji: ${item.emoji} | Role: <@&${item.roleId}>`).join("\n") || "No reaction roles configured.";

      const embed = UniversalEmbed.info("Reaction Roles List", ctx.guild)
        .setDescription(rrList);
      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `reactionrole [add|remove|list] ...`", ctx.guild)] });
  }
};
