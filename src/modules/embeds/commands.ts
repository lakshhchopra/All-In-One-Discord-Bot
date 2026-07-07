import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { EmbedBuilder, TextChannel } from "discord.js";

export const embedCommand: Command = {
  name: "embed",
  description: "Create, edit and display custom embeds.",
  category: "Extras",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // create, edit, show

    if (action === "create") {
      const channel = ctx.getChannelOption("channel", 1) as TextChannel || ctx.channel;
      const title = ctx.getStringOption("title", 2);
      const desc = ctx.args.slice(channel ? 2 : 1).join(" ");

      if (!title || !desc) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `embed create <channel> <title> <description>`", ctx.guild)] }, 5);
      }

      const embed = new EmbedBuilder()
        .setTitle(title)
        .setDescription(desc)
        .setColor(0x5865f2)
        .setTimestamp();

      const msg = await channel.send({ embeds: [embed] });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Embed posted: ${msg.url}`, ctx.guild)] });
    }

    if (action === "edit") {
      const msgId = ctx.getStringOption("messageId", 1);
      const title = ctx.getStringOption("title", 2);
      const desc = ctx.args.slice(2).join(" ");

      if (!msgId || !title || !desc) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `embed edit <messageId> <title> <description>`", ctx.guild)] }, 5);
      }

      try {
        const msg = await ctx.channel.messages.fetch(msgId);
        if (msg.author.id !== ctx.guild.members.me?.id) {
          return ctx.reply({ embeds: [UniversalEmbed.error("This message was not sent by the bot.", ctx.guild)] }, 5);
        }

        const embed = new EmbedBuilder()
          .setTitle(title)
          .setDescription(desc)
          .setColor(0x5865f2)
          .setTimestamp();

        await msg.edit({ embeds: [embed] });
        return ctx.reply({ embeds: [UniversalEmbed.success("Embed updated successfully.", ctx.guild)] });
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Could not find or edit message in this channel.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const msgId = ctx.getStringOption("messageId", 1);
      if (!msgId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `embed show <messageId>`", ctx.guild)] }, 5);

      try {
        const msg = await ctx.channel.messages.fetch(msgId);
        const embedJson = JSON.stringify(msg.embeds.map(e => e.toJSON()), null, 2);
        return ctx.reply({ content: `\`\`\`json\n${embedJson}\n\`\`\`` });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Could not find message.", ctx.guild)] }, 5);
      }
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `embed [create|edit|show] ...`", ctx.guild)] });
  }
};

export const autoresponderCommand: Command = {
  name: "autoresponder",
  description: "Manage auto responders.",
  category: "Extras",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // add, remove, list

    if (action === "add") {
      const trigger = ctx.getStringOption("trigger", 1);
      const response = ctx.args.slice(2).join(" ");

      if (!trigger || !response) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder add <trigger> <response>`", ctx.guild)] }, 5);
      }

      await prisma.autoResponder.upsert({
        where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
        update: { response },
        create: { guildId: ctx.guild.id, trigger, response }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder added for \`${trigger}\``, ctx.guild)] });
    }

    if (action === "remove") {
      const trigger = ctx.getStringOption("trigger", 1);
      if (!trigger) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder remove <trigger>`", ctx.guild)] }, 5);

      try {
        await prisma.autoResponder.delete({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder for \`${trigger}\` removed.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
      }
    }

    if (action === "list") {
      const list = await prisma.autoResponder.findMany({ where: { guildId: ctx.guild.id } });
      const respondersList = list.map(item => `• **${item.trigger}** → ${item.response}`).join("\n") || "No custom auto responders configured.";

      const embed = UniversalEmbed.info("Auto Responders List", ctx.guild)
        .setDescription(respondersList);
      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `autoresponder [add|remove|list] ...`", ctx.guild)] });
  }
};

export const reactionroleCommand: Command = {
  name: "reactionrole",
  description: "Configure reaction roles.",
  category: "Extras",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // add, remove, list

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

export const listCommand: Command = {
  name: "list",
  description: "List roles or bots in this server.",
  category: "Extras",
  execute: async (ctx) => {
    const action = ctx.getStringOption("type", 0); // roles, bots

    if (action === "roles") {
      const roles = ctx.guild.roles.cache.map(r => `• ${r.name} (${r.id})`).slice(0, 30).join("\n") + (ctx.guild.roles.cache.size > 30 ? "\n... and more" : "");
      const embed = UniversalEmbed.info("Server Roles List", ctx.guild)
        .setDescription(roles);
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "bots") {
      const bots = ctx.guild.members.cache.filter(m => m.user.bot).map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No bots in this server.";
      const embed = UniversalEmbed.info("Server Bots List", ctx.guild)
        .setDescription(bots);
      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `list [roles|bots]`", ctx.guild)] });
  }
};

export function registerExtras() {
  CommandRegistry.register(embedCommand);
  CommandRegistry.register(autoresponderCommand);
  CommandRegistry.register(reactionroleCommand);
  CommandRegistry.register(listCommand);
}
