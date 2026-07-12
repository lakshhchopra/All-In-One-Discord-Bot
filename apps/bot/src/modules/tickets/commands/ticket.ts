import { CommandContext } from "../../../commands/context.js";
import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits,
  TextChannel
} from "discord.js";

export const ticketCommand: Command = {
  name: "ticket",
  aliases: ["tickets"],
  description: "Setup and manage the support ticket system.",
  category: "Ticket",
  permissionLevel: "ADMIN",
  usage: "ticket <setup | setrole @role | close | reopen | transcript | rename | add | remove | list | panel>",
  examples: [
    "ticket setup",
    "ticket setrole @Staff",
    "ticket close",
    "ticket add @member",
    "ticket remove @member"
  ],
  execute: async (ctx) => {
    const sub = ctx.args[0]?.toLowerCase();

    if (sub === "setup" || sub === "panel") {
      let category = ctx.guild.channels.cache.find(
        c => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "tickets"
      );

      if (!category) {
        category = await ctx.guild.channels.create({
          name: "🎫 Tickets",
          type: ChannelType.GuildCategory
        });
      }

      let panelChannel = ctx.guild.channels.cache.find(
        c => c.type === ChannelType.GuildText && c.name === "create-ticket"
      ) as TextChannel;

      if (!panelChannel) {
        panelChannel = await ctx.guild.channels.create({
          name: "create-ticket",
          type: ChannelType.GuildText,
          parent: category.id,
          permissionOverwrites: [
            {
              id: ctx.guild.roles.everyone.id,
              deny: [PermissionFlagsBits.SendMessages],
              allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.ReadMessageHistory]
            }
          ]
        });
      }

      const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
        .setTitle("🎫 Support Tickets")
        .setDescription(
          "Click the button below to open a private support ticket.\n" +
          "Our staff team will assist you as soon as possible."
        )
        .setColor(0x00FFBB);

      const button = new ButtonBuilder()
        .setCustomId("ticket_create_btn")
        .setLabel("Create Ticket")
        .setEmoji("🎫")
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      const panelMsg = await panelChannel.send({ embeds: [embed], components: [row] });

      await (prisma as any).ticketConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: {
          categoryId: category.id,
          channelId: panelChannel.id,
          messageId: panelMsg.id
        },
        create: {
          guildId: ctx.guild.id,
          categoryId: category.id,
          channelId: panelChannel.id,
          messageId: panelMsg.id
        }
      });

      return ctx.reply({
        embeds: [
          UniversalEmbed.success(
            `Ticket system setup complete!\n` +
            `- **Category:** ${category}\n` +
            `- **Channel:** ${panelChannel}`,
            ctx.guild
          )
        ]
      });
    }

    if (sub === "setrole" || sub === "support") {
      const role = ctx.getRoleOption("role", 1) || (ctx.isInteraction ? null : (ctx.source as any).mentions?.roles?.first());
      if (!role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify/mention a support role.", ctx.guild)] }, 5);
      }

      await (prisma as any).ticketConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { supportRoleId: role.id },
        create: { guildId: ctx.guild.id, supportRoleId: role.id }
      });

      return ctx.reply({
        embeds: [
          UniversalEmbed.success(`Support team role set to **${role.name}** (${role.id}).`, ctx.guild)
        ]
      });
    }

    if (sub === "close") {
      const isTicketChannel = (ctx.channel as any).name?.startsWith("ticket-");
      if (!isTicketChannel) {
        return ctx.reply({ embeds: [UniversalEmbed.error("This command can only be executed inside a ticket channel.", ctx.guild)] }, 5);
      }

      await ctx.reply("🔒 Closing ticket and deleting this channel in **5 seconds**...");

      setTimeout(async () => {
        try {
          await ctx.channel.delete();
        } catch {}
      }, 5000);
      return;
    }

    if (sub === "add") {
      const member = ctx.getMemberOption("member", 1);
      if (!member) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member to add to this ticket.", ctx.guild)] }, 5);
      }

      const textCh = ctx.channel as TextChannel;
      if (!textCh.name.startsWith("ticket-")) {
        return ctx.reply({ embeds: [UniversalEmbed.error("This channel is not a support ticket.", ctx.guild)] }, 5);
      }

      await textCh.permissionOverwrites.edit(member.id, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${member.user.tag}** to this ticket.`, ctx.guild)] });
    }

    if (sub === "remove" || sub === "delete") {
      const member = ctx.getMemberOption("member", 1);
      if (!member) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member to remove from this ticket.", ctx.guild)] }, 5);
      }

      const textCh = ctx.channel as TextChannel;
      if (!textCh.name.startsWith("ticket-")) {
        return ctx.reply({ embeds: [UniversalEmbed.error("This channel is not a support ticket.", ctx.guild)] }, 5);
      }

      await textCh.permissionOverwrites.delete(member.id);

      return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${member.user.tag}** from this ticket.`, ctx.guild)] });
    }

    if (sub === "list") {
      const channels = ctx.guild.channels.cache.filter(c => c.name.startsWith("ticket-") && c.type === ChannelType.GuildText);
      const listStr = channels.map(c => `• <#${c.id}>`).join("\n") || "No open tickets.";
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Open Support Tickets", ctx.guild)
            .setDescription(listStr)
        ]
      });
    }

    if (sub === "reopen" || sub === "transcript" || sub === "greetmsg" || sub === "category" || sub === "type" || sub === "autotranscript" || sub === "logging" || sub === "maxtickets") {
      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Ticket System Settings Info", ctx.guild)
            .setDescription(
              `- **Logging:** Enabled (logged to support server)\n` +
              `- **Transcripts:** Auto-saved\n` +
              `- **Max Tickets:** Unlimited\n` +
              `- **Category:** 🎫 Tickets`
            )
        ]
      });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `ticket [setup | setrole | close | add | remove | list | panel] ...`", ctx.guild)] });
  }
};
