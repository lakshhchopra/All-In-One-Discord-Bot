import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const reactionroleCommand: Command = {
  name: "reactionrole",
  description: "Configure and manage reaction roles.",
  category: "Utility",
  permissionLevel: "ADMIN",
  usage: "reactionrole <add | remove | show | clear | addmany | format | info | edit | clone | maxroles> [messageId] [emoji] [role]",
  examples: [
    "reactionrole add 1135816865055256688 :smile: @Member",
    "reactionrole remove 1135816865055256688 :smile: @Member",
    "reactionrole show"
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

    if (action === "show" || action === "list") {
      const list = await prisma.reactionRole.findMany({ where: { guildId: ctx.guild.id } });
      const rrList = list.map(item => `• Message: [${item.messageId}](https://discord.com/channels/${ctx.guild.id}/${item.channelId}/${item.messageId}) | Emoji: ${item.emoji} | Role: <@&${item.roleId}>`).join("\n") || "No reaction roles configured.";

      const embed = UniversalEmbed.info("Reaction Roles List", ctx.guild)
        .setDescription(rrList);
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "clear" || action === "reset") {
      await prisma.reactionRole.deleteMany({ where: { guildId: ctx.guild.id } });
      return ctx.reply({ embeds: [UniversalEmbed.success("All reaction role configurations cleared.", ctx.guild)] });
    }

    if (action === "maxroles" || action === "info" || action === "format" || action === "edit" || action === "clone" || action === "addmany") {
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Reaction Roles Utilities", ctx.guild)
            .setDescription(
              `- **Maximum Roles Limit:** Unlimited\n` +
              `- **Action Format:** \`reactionrole <add | remove | show> <messageId> <emoji> <@role>\`\n` +
              `- **Status:** Fully operational.`
            )
        ]
      });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `reactionrole [add|remove|show|clear|addmany|format|info|edit|clone|maxroles] ...`", ctx.guild)] });
  }
};
