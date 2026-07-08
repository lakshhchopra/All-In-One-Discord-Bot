import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder } from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const variablesCommand: Command = {
  name: "variables",
  description: "Displays the guide for using placeholders and variables.",
  category: "Media",
  aliases: ["var", "vars", "placeholders"],
  execute: async (ctx) => {
    const pages = [
      // Page 1: User variables
      new UniversalEmbed("neutral", undefined, ctx.guild)
        .setTitle("👤 User Placeholders")
        .setDescription("Use these placeholders to display user/author details dynamically:")
        .addFields(
          { name: "`{user}`", value: "Mentions the user (e.g. <@853160086598713345>)", inline: true },
          { name: "`{user_tag}`", value: "User tag (e.g. username#1234 or username)", inline: true },
          { name: "`{user_name}`", value: "Username of the member", inline: true },
          { name: "`{user_id}`", value: "Discord ID of the user", inline: true },
          { name: "`{user_nick}`", value: "Server nickname or username", inline: true },
          { name: "`{user_avatar}`", value: "User profile picture URL", inline: true },
          { name: "`{user_createdate}`", value: "Account creation date", inline: true },
          { name: "`{user_joindate}`", value: "Server join date", inline: true }
        ),

      // Page 2: Server variables
      new UniversalEmbed("neutral", undefined, ctx.guild)
        .setTitle("🏡 Server Placeholders")
        .setDescription("Use these placeholders to display general server information:")
        .addFields(
          { name: "`{server_prefix}`", value: "Current bot prefix in the server", inline: true },
          { name: "`{server_name}`", value: "Name of the server", inline: true },
          { name: "`{server_id}`", value: "Discord ID of the server", inline: true },
          { name: "`{server_membercount}`", value: "Total member count (humans + bots)", inline: true },
          { name: "`{server_botcount}`", value: "Total bot count", inline: true },
          { name: "`{server_icon}`", value: "Server icon URL", inline: true },
          { name: "`{server_owner}`", value: "Mentions the server owner", inline: true },
          { name: "`{server_owner_id}`", value: "Server owner's User ID", inline: true },
          { name: "`{server_createdate}`", value: "Server creation date", inline: true }
        ),

      // Page 3: Channel & Boost variables
      new UniversalEmbed("neutral", undefined, ctx.guild)
        .setTitle("💎 Channel & Boost Placeholders")
        .setDescription("Placeholders relating to text channels and boost states:")
        .addFields(
          { name: "`{server_boostlevel}`", value: "Server boost level (Tier 0-3)", inline: true },
          { name: "`{server_boostcount}`", value: "Total number of boosts", inline: true },
          { name: "`{channel}`", value: "Mentions the current text channel", inline: true },
          { name: "`{channel_name}`", value: "Name of the current channel", inline: true },
          { name: "`{date}`", value: "Current calendar date", inline: true },
          { name: "`{newline}`", value: "Force text to break onto a new line", inline: true },
          { name: "Placeholder Embeds", value: "Include `{embed:name}` anywhere to attach a saved embed!", inline: false }
        )
    ];

    let currentPage = 0;

    const getButtons = (pageIndex: number) => {
      return new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("◀️ Previous")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex === 0),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("▶️ Next")
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pageIndex === pages.length - 1)
      );
    };

    const response = await ctx.reply({
      embeds: [pages[currentPage]],
      components: [getButtons(currentPage) as any]
    });

    if (!response) return;

    // Use interaction collector to handle page switching
    const collector = response.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 60000 // 1 minute timeout
    });

    collector.on("collect", async (interaction) => {
      // Check if button click was from the command author
      if (interaction.user.id !== ctx.user.id) {
        return interaction.reply({ content: "❌ You cannot control this help guide.", ephemeral: true });
      }

      if (interaction.customId === "prev") {
        currentPage = Math.max(0, currentPage - 1);
      } else if (interaction.customId === "next") {
        currentPage = Math.min(pages.length - 1, currentPage + 1);
      }

      await interaction.update({
        embeds: [pages[currentPage]],
        components: [getButtons(currentPage) as any]
      });
    });

    collector.on("end", async () => {
      try {
        // Disable buttons upon timeout
        const disabledButtons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("prev").setLabel("◀️ Previous").setStyle(ButtonStyle.Secondary).setDisabled(true),
          new ButtonBuilder().setCustomId("next").setLabel("▶️ Next").setStyle(ButtonStyle.Secondary).setDisabled(true)
        );
        await response.edit({ components: [disabledButtons as any] });
      } catch {}
    });
  }
};
