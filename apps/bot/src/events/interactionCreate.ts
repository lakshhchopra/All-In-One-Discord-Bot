import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction, ChannelType, PermissionFlagsBits, TextChannel, ChannelSelectMenuBuilder } from "discord.js";
import { CommandContext } from "../commands/context.js";
import { handleCommand, CommandRegistry } from "../commands/command.js";
import { prisma } from "../services/db.js";
import { UniversalEmbed } from "../services/embed.js";
import { getLoggingConfigPayload } from "../services/logger.js";
import { EMOJIS } from "../config/emojis.js";
import { 
  getHomeEmbed, 
  getCategoryEmbed, 
  getAllCommandsEmbed,
  resolveCategory,
  getCommandModule,
  COMMAND_USAGES
} from "../modules/botinfo/commands.js";
import { handleTempVcInteraction } from "../modules/tempvc/panel.js";

export async function handleInteractionCreate(interaction: Interaction) {
  // Handle TempVC Panel/Modal/Menu Interactions
  if (
    (interaction.isButton() || interaction.isUserSelectMenu() || interaction.isModalSubmit()) &&
    interaction.customId &&
    interaction.customId.startsWith("tempvc_")
  ) {
    await handleTempVcInteraction(interaction);
    return;
  }

  // Handle Ticket Interactions
  if (interaction.isButton() && interaction.customId === "ticket_create_btn") {
    await interaction.deferReply({ ephemeral: true });

    try {
      const ticketConfig = await (prisma as any).ticketConfig.findUnique({
        where: { guildId: interaction.guild!.id }
      });

      if (!ticketConfig || !ticketConfig.categoryId) {
        return interaction.editReply({ content: "❌ Ticket category has not been configured by an admin yet." });
      }

      const existingChannel = interaction.guild!.channels.cache.find(
        c => c.type === ChannelType.GuildText && 
             c.parentId === ticketConfig.categoryId && 
             c.name === `ticket-${interaction.user.username.toLowerCase()}`
      );

      if (existingChannel) {
        return interaction.editReply({ content: `❌ You already have an open ticket: ${existingChannel}` });
      }

      const permissionOverwrites = [
        {
          id: interaction.guild!.roles.everyone.id,
          deny: [PermissionFlagsBits.ViewChannel]
        },
        {
          id: interaction.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
        }
      ];

      if (ticketConfig.supportRoleId) {
        permissionOverwrites.push({
          id: ticketConfig.supportRoleId,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks, PermissionFlagsBits.AttachFiles]
        });
      }

      const ticketChannel = await interaction.guild!.channels.create({
        name: `ticket-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: ticketConfig.categoryId,
        permissionOverwrites
      });

      const embed = new UniversalEmbed("neutral", undefined, interaction.guild!)
        .setTitle(`Support Ticket: ${interaction.user.username}`)
        .setDescription(
          `Thank you for reaching out, ${interaction.user}.\n` +
          `Please describe your issue or question in detail here.\n` +
          `A staff member will assist you shortly.`
        )
        .setColor(0x00FFBB);

      const closeButton = new ButtonBuilder()
        .setCustomId("ticket_close_btn")
        .setLabel("Close Ticket")
        .setEmoji("🔒")
        .setStyle(ButtonStyle.Danger);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(closeButton);

      const pingContent = ticketConfig.supportRoleId 
        ? `<@${interaction.user.id}> | <@&${ticketConfig.supportRoleId}>`
        : `<@${interaction.user.id}>`;

      await ticketChannel.send({ content: pingContent, embeds: [embed], components: [row] });

      return interaction.editReply({ content: `✅ Ticket opened successfully in ${ticketChannel}!` });
    } catch (err) {
      console.error("Error creating ticket:", err);
      return interaction.editReply({ content: "❌ An error occurred while opening your ticket. Please try again later." });
    }
  }

  if (interaction.isButton() && interaction.customId === "ticket_close_btn") {
    await interaction.deferUpdate();
    try {
      await (interaction.channel as TextChannel).send("🔒 This ticket will be closed and deleted in **5 seconds**...");
      setTimeout(async () => {
        await interaction.channel?.delete().catch(() => null);
      }, 5000);
    } catch {}
    return;
  }

  // Handle Interactive Logging Configurations
  if (interaction.isStringSelectMenu() && interaction.customId === "logging_config_pick_category") {
    await interaction.deferReply({ ephemeral: true });
    const category = interaction.values[0];

    const channelSelect = new ChannelSelectMenuBuilder()
      .setCustomId(`logging_config_set_channel:${category}`)
      .setPlaceholder(`Pick a log channel for ${category}...`)
      .setChannelTypes([ChannelType.GuildText]);

    const row = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(channelSelect);

    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guild!.id } });
    const logData = (config?.logToggles as any) || {};
    const toggles = logData.toggles || {};
    const isEnabled = toggles[category] !== false;

    const toggleBtn = new ButtonBuilder()
      .setCustomId(`logging_config_toggle:${category}`)
      .setLabel(isEnabled ? "Disable Category" : "Enable Category")
      .setStyle(isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

    const backBtn = new ButtonBuilder()
      .setCustomId("logging_config_back")
      .setLabel("Back to Config Menu")
      .setStyle(ButtonStyle.Secondary);

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleBtn, backBtn);

    await interaction.editReply({
      content: `⚙️ Configuring logging for **${category}**:\nChoose a text channel below or toggle this category.`,
      components: [row as any, row2]
    });
    return;
  }

  if (interaction.isChannelSelectMenu() && interaction.customId.startsWith("logging_config_set_channel:")) {
    await interaction.deferUpdate();
    const category = interaction.customId.split(":")[1];
    const channelId = interaction.values[0];

    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guild!.id } });
    const logData = (config?.logToggles as any) || {};
    const toggles = logData.toggles || {};
    const channels = logData.channels || {};

    channels[category] = channelId;
    const updatedLogToggles = { toggles, channels };

    await prisma.guildConfig.upsert({
      where: { guildId: interaction.guild!.id },
      update: { logToggles: updatedLogToggles },
      create: { guildId: interaction.guild!.id, logToggles: updatedLogToggles }
    });

    const payload = await getLoggingConfigPayload(interaction.guild!);
    try {
      await interaction.message.edit(payload);
    } catch {
      await interaction.webhook.editMessage(interaction.message.id, payload).catch(() => null);
    }

    await interaction.followUp({
      content: `✅ Custom logging channel for **${category}** set to <#${channelId}>!`,
      ephemeral: true
    });
    return;
  }

  if (interaction.isButton() && interaction.customId.startsWith("logging_config_toggle:")) {
    await interaction.deferUpdate();
    const category = interaction.customId.split(":")[1];

    const config = await prisma.guildConfig.findUnique({ where: { guildId: interaction.guild!.id } });
    const logData = (config?.logToggles as any) || {};
    const toggles = logData.toggles || {};
    const channels = logData.channels || {};

    const isEnabled = toggles[category] !== false;
    toggles[category] = !isEnabled;

    const updatedLogToggles = { toggles, channels };

    await prisma.guildConfig.upsert({
      where: { guildId: interaction.guild!.id },
      update: { logToggles: updatedLogToggles },
      create: { guildId: interaction.guild!.id, logToggles: updatedLogToggles }
    });

    const payload = await getLoggingConfigPayload(interaction.guild!);
    try {
      await interaction.message.edit(payload);
    } catch {
      await interaction.webhook.editMessage(interaction.message.id, payload).catch(() => null);
    }

    const toggleBtn = new ButtonBuilder()
      .setCustomId(`logging_config_toggle:${category}`)
      .setLabel(!isEnabled ? "Disable Category" : "Enable Category")
      .setStyle(!isEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

    const backBtn = new ButtonBuilder()
      .setCustomId("logging_config_back")
      .setLabel("Back to Config Menu")
      .setStyle(ButtonStyle.Secondary);

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(toggleBtn, backBtn);

    await interaction.editReply({
      content: `⚙️ Configuring logging for **${category}**:\nChoose a text channel below or toggle this category.`,
      components: [interaction.message.components[0] as any, row2]
    });
    return;
  }

  if (interaction.isButton() && interaction.customId === "logging_config_back") {
    await interaction.deferUpdate();
    await interaction.editReply({
      content: "✅ Configurations updated. You can dismiss this prompt.",
      components: []
    });
    return;
  }

  // Handle Help Menu Interactions
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    const customId = interaction.customId;
    if (customId.startsWith("help:")) {
      const parts = customId.split(":");
      const action = parts[1];
      const targetUserId = action === "show" ? parts[3] : parts[2];

      if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: "❌ You cannot use this help menu. Run `-help` to create your own.", ephemeral: true });
      }

      const guildId = interaction.guildId!;
      const config = await prisma.guildConfig.findUnique({ where: { guildId } });
      const prefix = config?.prefix ?? "-";

      if (action === "home") {
        const embed = getHomeEmbed(prefix, interaction.guild!);
        await interaction.update({ embeds: [embed] });
      } 
      else if (action === "delete") {
        await interaction.message.delete();
      } 
      else if (action === "all") {
        const embed = getAllCommandsEmbed(prefix, interaction.guild!);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } 
      else if (action === "category" && interaction.isStringSelectMenu()) {
        const selectedCategory = interaction.values[0];
        const embed = getCategoryEmbed(selectedCategory, prefix, interaction.guild!);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      else if (action === "show") {
        try {
          await interaction.message.delete();
        } catch {}

        const targetCmd = parts[2];
        const resolvedCat = resolveCategory(targetCmd);

        if (resolvedCat) {
          const embed = getCategoryEmbed(resolvedCat, prefix, interaction.guild!);
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        if (targetCmd === "tempvc" || targetCmd.startsWith("tempvc ")) {
          const { TEMPVC_DESCRIPTIONS, COMMAND_USAGES } = await import("../modules/botinfo/commands/help.js");
          if (targetCmd === "tempvc") {
            const embed = new UniversalEmbed("neutral", undefined, interaction.guild!)
              .setTitle("🔊 tempvc")
              .setDescription(
                `**Description:** Manage temporary voice channels and configurations.\n` +
                `**Usage:** \`${prefix}tempvc <lock | unlock | hide | unhide | rename | limit | trust | untrust | kick | claim | transfer | sendpanel | generator>\``
              );
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }

          const desc = TEMPVC_DESCRIPTIONS[targetCmd];
          const usage = COMMAND_USAGES[targetCmd];
          if (desc && usage) {
            const embed = new UniversalEmbed("neutral", undefined, interaction.guild!)
              .setTitle(`🔊 ${targetCmd}`)
              .setDescription(`**Description:** ${desc}\n**Usage:** \`${prefix}${usage}\``);
            return interaction.reply({ embeds: [embed], ephemeral: true });
          }
        }

        const command = CommandRegistry.get(targetCmd);
        if (!command) {
          return interaction.reply({ 
            embeds: [UniversalEmbed.error(`Command or Category \`${targetCmd}\` not found.`, interaction.guild!)], 
            ephemeral: true 
          });
        }

        const moduleKey = getCommandModule(command.category);
        const emojiKey = moduleKey === "extra" ? "settings" : moduleKey;
        const emoji = EMOJIS[emojiKey as keyof typeof EMOJIS] || EMOJIS.settings;
        
        const usageStr = command.usage || COMMAND_USAGES[command.name.toLowerCase()] || command.name;
        const examplesList = command.examples && command.examples.length > 0
          ? command.examples.map(ex => `\`${prefix}${ex}\``).join(", ")
          : null;

        let embedDesc = `**Description:** ${command.description}\n**Usage:** \`${prefix}${usageStr}\``;
        if (examplesList) {
          embedDesc += `\n**Example(s):** ${examplesList}`;
        }

        const embed = new UniversalEmbed("neutral", undefined, interaction.guild!)
          .setTitle(`${emoji}・${command.name}`)
          .setDescription(embedDesc);

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return;
    }
  }

  if (interaction.isChatInputCommand()) {
    const ctx = new CommandContext(interaction);
    await ctx.initPrefix();
    await handleCommand(ctx, interaction.commandName);
  }

  else if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId === "giveaway_join") {
      const msgId = interaction.message.id;
      const userId = interaction.user.id;

      const giveaway = await prisma.giveaway.findUnique({ where: { id: msgId } });
      if (!giveaway || giveaway.ended) {
        return interaction.reply({ content: "❌ This giveaway has ended or does not exist.", ephemeral: true });
      }

      let entries = giveaway.entries;
      let replyText = "";

      if (entries.includes(userId)) {
        // Already entered -> remove entry (opt-out option)
        entries = entries.filter(id => id !== userId);
        replyText = "❌ You have left the giveaway.";
      } else {
        entries.push(userId);
        replyText = "🎉 You have entered the giveaway!";
      }

      await prisma.giveaway.update({
        where: { id: msgId },
        data: { entries }
      });

      try {
        const joinButton = new ButtonBuilder()
          .setCustomId("giveaway_join")
          .setLabel(`Join (${entries.length})`)
          .setEmoji("🎉")
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

        await interaction.update({ components: [row] });
      } catch {}

      await interaction.followUp({ content: replyText, ephemeral: true });
    }
  }
}
