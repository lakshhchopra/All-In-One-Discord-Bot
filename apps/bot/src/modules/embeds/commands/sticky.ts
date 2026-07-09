import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const stickyCommand: Command = {
  name: "sticky",
  description: "Configure sticky messages that stick to the bottom of text channels.",
  category: "Utility",
  permissionLevel: "ADMIN",
  usage: "sticky <add | remove | show | bump | reset | channel> [message]",
  examples: [
    "sticky add Read the rules before chatting!",
    "sticky show",
    "sticky remove"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add" || action === "channel" || action === "channel add") {
      const message = ctx.args.slice(1).join(" ");
      if (!message) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify the sticky message text.", ctx.guild)] }, 5);
      }

      await prisma.stickyMessage.upsert({
        where: { channelId: ctx.channel.id },
        update: { message, lastMessageId: null },
        create: { guildId: ctx.guild.id, channelId: ctx.channel.id, message }
      });

      // Send the initial sticky message
      const sent = await (ctx.channel as any).send({
        embeds: [
          new UniversalEmbed("neutral", undefined, ctx.guild)
            .setDescription(`📌 **Sticky Message**\n\n${message}`)
        ]
      });

      await prisma.stickyMessage.update({
        where: { channelId: ctx.channel.id },
        data: { lastMessageId: sent.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success("Sticky message configured successfully.", ctx.guild)] }, 5);
    }

    if (action === "remove" || action === "reset" || action === "channel remove") {
      try {
        const sticky = await prisma.stickyMessage.findUnique({
          where: { channelId: ctx.channel.id }
        });

        if (sticky && sticky.lastMessageId) {
          try {
            const oldMsg = await ctx.channel.messages.fetch(sticky.lastMessageId);
            await oldMsg.delete();
          } catch {}
        }

        await prisma.stickyMessage.delete({
          where: { channelId: ctx.channel.id }
        });

        return ctx.reply({ embeds: [UniversalEmbed.success("Sticky message removed from this channel.", ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("No sticky message configured in this channel.", ctx.guild)] }, 5);
      }
    }

    if (action === "show" || action === "list") {
      const sticky = await prisma.stickyMessage.findUnique({
        where: { channelId: ctx.channel.id }
      });

      if (!sticky) {
        return ctx.reply({ embeds: [UniversalEmbed.info("No sticky message configured in this channel.", ctx.guild)] });
      }

      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Sticky Message Config", ctx.guild)
            .setDescription(`📌 **Message:** ${sticky.message}`)
        ]
      });
    }

    if (action === "bump") {
      const sticky = await prisma.stickyMessage.findUnique({
        where: { channelId: ctx.channel.id }
      });

      if (!sticky) {
        return ctx.reply({ embeds: [UniversalEmbed.error("No sticky message found to bump.", ctx.guild)] }, 5);
      }

      if (sticky.lastMessageId) {
        try {
          const oldMsg = await ctx.channel.messages.fetch(sticky.lastMessageId);
          await oldMsg.delete();
        } catch {}
      }

      const sent = await (ctx.channel as any).send({
        embeds: [
          new UniversalEmbed("neutral", undefined, ctx.guild)
            .setDescription(`📌 **Sticky Message**\n\n${sticky.message}`)
        ]
      });

      await prisma.stickyMessage.update({
        where: { channelId: ctx.channel.id },
        data: { lastMessageId: sent.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success("Sticky message bumped successfully.", ctx.guild)] }, 5);
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `sticky [add|remove|show|bump|reset|channel] ...`", ctx.guild)] });
  }
};
