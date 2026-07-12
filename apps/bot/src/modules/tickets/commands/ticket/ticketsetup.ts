import { Command } from "../../../../commands/command.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ChannelType, 
  PermissionFlagsBits,
  TextChannel,
  ApplicationCommandOptionType
} from "discord.js";

export const ticketsetupCommand: Command = {
  name: "ticketsetup",
  aliases: ["ticket setup", "ticket panel", "ticketpanel"],
  description: "Setup the support ticket system and deploy the ticket panel.",
  category: "Ticket",
  permissionLevel: "ADMIN",
  usage: "ticket setup",
  execute: async (ctx: any) => {
    let category = ctx.guild.channels.cache.find(
      (c: any) => c.type === ChannelType.GuildCategory && c.name.toLowerCase() === "tickets"
    );

    if (!category) {
      category = await ctx.guild.channels.create({
        name: "🎫 Tickets",
        type: ChannelType.GuildCategory
      });
    }

    let panelChannel = ctx.guild.channels.cache.find(
      (c: any) => c.type === ChannelType.GuildText && c.name === "create-ticket"
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
};

