import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  UserSelectMenuBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Interaction,
  GuildMember,
  VoiceChannel,
  PermissionFlagsBits,
  AttachmentBuilder
} from "discord.js";
import path from "path";
import { prisma } from "../../services/db.js";
import { UniversalEmbed } from "../../services/embed.js";
import { EMOJIS, parseEmoji } from "../../config/emojis.js";

// Returns the 12 controller buttons in 3 rows (4 buttons each)
export function getTempVcPanelRows() {
  // Row 1: Name, limit, region, kick
  const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("tempvc_rename_btn").setEmoji(parseEmoji(EMOJIS.tempvc_rename) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_limit_btn").setEmoji(parseEmoji(EMOJIS.tempvc_limit) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_region_btn").setEmoji(parseEmoji(EMOJIS.tempvc_region) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_kick_btn").setEmoji(parseEmoji(EMOJIS.tempvc_kick) as any).setStyle(ButtonStyle.Secondary)
  );

  // Row 2: Lock, unlock, hide, unhide
  const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("tempvc_lock_btn").setEmoji(parseEmoji(EMOJIS.tempvc_lock) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_unlock_btn").setEmoji(parseEmoji(EMOJIS.tempvc_unlock) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_hide_btn").setEmoji(parseEmoji(EMOJIS.tempvc_hide) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_unhide_btn").setEmoji(parseEmoji(EMOJIS.tempvc_unhide) as any).setStyle(ButtonStyle.Secondary)
  );

  // Row 3: Transfer, claim, trust, untrust
  const row3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId("tempvc_transfer_btn").setEmoji(parseEmoji(EMOJIS.tempvc_transfer) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_claim_btn").setEmoji(parseEmoji(EMOJIS.tempvc_claim) as any).setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId("tempvc_trust_btn").setEmoji(parseEmoji(EMOJIS.tempvc_trust) as any).setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId("tempvc_untrust_btn").setEmoji(parseEmoji(EMOJIS.tempvc_untrust) as any).setStyle(ButtonStyle.Secondary)
  );

  return [row1, row2, row3];
}

// Sends the interface embed to a temp voice channel's chat
export async function sendTempVcInterface(channel: VoiceChannel, ownerId: string) {
  const imagePath = path.join(process.cwd(), "apps/bot/src/assets/tempvc_panel.png");
  const attachment = new AttachmentBuilder(imagePath, { name: "tempvc_panel.png" });

  const config = await prisma.guildConfig.findUnique({ where: { guildId: channel.guild.id } });
  const prefix = config?.prefix ?? "-";

  const embed = new UniversalEmbed("neutral", undefined, channel.guild)
    .setTitle("TempVoice Control Panel")
    .setDescription(
      `Use the buttons below to control your temporary voice channel.\n` +
      `Type \`${prefix}help tempvc\` in chat for more info.`
    )
    .setImage("attachment://tempvc_panel.png")
    .setColor(0xFF0055); // Neon Red/Pink matching the border color

  const components = getTempVcPanelRows();

  try {
    await channel.send({ content: `<@${ownerId}>`, embeds: [embed], files: [attachment], components });
  } catch (err) {
    console.error("⚠️ Failed to send temp VC panel to channel:", channel.id, err);
  }
}

// Retrieves the targeted temp VC based on context
async function getTargetTempVC(interaction: Interaction) {
  if (!interaction.guild) return null;

  // 1. Check if current channel is a temp VC itself
  const channelTempVC = await prisma.tempVC.findUnique({
    where: { channelId: interaction.channelId ?? "" }
  });

  if (channelTempVC) {
    const channel = interaction.guild.channels.cache.get(interaction.channelId!) as VoiceChannel | undefined;
    return { dbVc: channelTempVC, channel };
  }

  // 2. Otherwise check user's voice channel
  const member = interaction.member as GuildMember | null;
  const voiceChannelId = member?.voice?.channelId;
  if (voiceChannelId) {
    const voiceTempVC = await prisma.tempVC.findUnique({
      where: { channelId: voiceChannelId }
    });
    if (voiceTempVC) {
      const channel = interaction.guild.channels.cache.get(voiceChannelId) as VoiceChannel | undefined;
      return { dbVc: voiceTempVC, channel };
    }
  }

  return null;
}

// Entrypoint for handling interaction buttons, select menus, and modals
export async function handleTempVcInteraction(interaction: Interaction) {
  if (!interaction.guild) return;
  if (!interaction.isButton() && !interaction.isUserSelectMenu() && !interaction.isStringSelectMenu() && !interaction.isModalSubmit()) return;

  const customId = interaction.customId;

  // 1. Resolve Target Voice Channel
  const res = await getTargetTempVC(interaction);
  const isClaim = customId === "tempvc_claim_btn";

  if (!res && !isClaim) {
    if (interaction.isRepliable()) {
      await interaction.reply({
        embeds: [UniversalEmbed.error("You must be in a temporary voice channel or using this button within its chat to use this controller.", interaction.guild)],
        ephemeral: true
      });
    }
    return;
  }

  const dbVc = res?.dbVc;
  const channel = res?.channel;

  // 2. Authorization check
  if (!isClaim && dbVc && dbVc.ownerId !== interaction.user.id) {
    if (interaction.isRepliable()) {
      await interaction.reply({
        embeds: [UniversalEmbed.error("Only the channel owner can manage this channel.", interaction.guild)],
        ephemeral: true
      });
    }
    return;
  }

  // 3. Handle Button Interactions
  if (interaction.isButton()) {
    try {
      if (customId === "tempvc_lock_btn") {
        if (!channel) return;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: false });
        await prisma.tempVC.update({ where: { channelId: channel.id }, data: { locked: true } });
        await interaction.reply({ embeds: [UniversalEmbed.success("🔒 Voice channel locked. Only trusted users can join.", interaction.guild)], ephemeral: true });
      }

      else if (customId === "tempvc_unlock_btn") {
        if (!channel) return;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { Connect: null });
        await prisma.tempVC.update({ where: { channelId: channel.id }, data: { locked: false } });
        await interaction.reply({ embeds: [UniversalEmbed.success("🔓 Voice channel unlocked for everyone.", interaction.guild)], ephemeral: true });
      }

      else if (customId === "tempvc_hide_btn") {
        if (!channel) return;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
        await interaction.reply({ embeds: [UniversalEmbed.success("🙈 Voice channel hidden from the channel list.", interaction.guild)], ephemeral: true });
      }

      else if (customId === "tempvc_unhide_btn") {
        if (!channel) return;
        await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: null });
        await interaction.reply({ embeds: [UniversalEmbed.success("👁️ Voice channel is now visible to everyone.", interaction.guild)], ephemeral: true });
      }

      else if (customId === "tempvc_rename_btn") {
        const modal = new ModalBuilder()
          .setCustomId("tempvc_rename_modal")
          .setTitle("Rename Voice Channel");

        const nameInput = new TextInputBuilder()
          .setCustomId("tempvc_new_name")
          .setLabel("New Channel Name")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(100);

        if (dbVc) {
          nameInput.setValue(dbVc.name);
        }

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput));
        await interaction.showModal(modal);
      }

      else if (customId === "tempvc_limit_btn") {
        const modal = new ModalBuilder()
          .setCustomId("tempvc_limit_modal")
          .setTitle("Change User Limit");

        const limitInput = new TextInputBuilder()
          .setCustomId("tempvc_new_limit")
          .setLabel("User Limit (0-99)")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMaxLength(2);

        if (dbVc) {
          limitInput.setValue(dbVc.limit.toString());
        }

        modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(limitInput));
        await interaction.showModal(modal);
      }

      else if (customId === "tempvc_region_btn") {
        const select = new StringSelectMenuBuilder()
          .setCustomId("tempvc_region_select")
          .setPlaceholder("Select Voice Region")
          .addOptions(
            { label: "Automatic", value: "automatic" },
            { label: "US East", value: "us-east" },
            { label: "US West", value: "us-west" },
            { label: "Europe", value: "rotterdam" },
            { label: "India", value: "india" },
            { label: "Singapore", value: "singapore" }
          );

        await interaction.reply({
          content: "🌐 Select a voice region from the dropdown below:",
          components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select)],
          ephemeral: true
        });
      }

      else if (customId === "tempvc_trust_btn") {
        const select = new UserSelectMenuBuilder()
          .setCustomId("tempvc_trust_select")
          .setPlaceholder("Select a user to trust")
          .setMinValues(1)
          .setMaxValues(1);

        await interaction.reply({
          content: "🤝 Select a member from the dropdown below to trust them:",
          components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(select)],
          ephemeral: true
        });
      }

      else if (customId === "tempvc_untrust_btn") {
        const select = new UserSelectMenuBuilder()
          .setCustomId("tempvc_untrust_select")
          .setPlaceholder("Select a user to remove trust")
          .setMinValues(1)
          .setMaxValues(1);

        await interaction.reply({
          content: "💔 Select a member from the dropdown below to remove trust:",
          components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(select)],
          ephemeral: true
        });
      }

      else if (customId === "tempvc_kick_btn") {
        const select = new UserSelectMenuBuilder()
          .setCustomId("tempvc_kick_select")
          .setPlaceholder("Select a user to kick")
          .setMinValues(1)
          .setMaxValues(1);

        await interaction.reply({
          content: "🚷 Select a member from the dropdown below to kick from VC:",
          components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(select)],
          ephemeral: true
        });
      }

      else if (customId === "tempvc_block_btn") {
        const select = new UserSelectMenuBuilder()
          .setCustomId("tempvc_block_select")
          .setPlaceholder("Select a user to block")
          .setMinValues(1)
          .setMaxValues(1);

        await interaction.reply({
          content: "🚫 Select a member from the dropdown below to block them from joining:",
          components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(select)],
          ephemeral: true
        });
      }

      else if (customId === "tempvc_transfer_btn") {
        const select = new UserSelectMenuBuilder()
          .setCustomId("tempvc_transfer_select")
          .setPlaceholder("Select a user to transfer ownership")
          .setMinValues(1)
          .setMaxValues(1);

        await interaction.reply({
          content: "👑 Select a member from the dropdown below to transfer ownership to:",
          components: [new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(select)],
          ephemeral: true
        });
      }

      else if (customId === "tempvc_claim_btn") {
        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;
        if (!voiceChannel) {
          return interaction.reply({
            embeds: [UniversalEmbed.error("You are not in a voice channel.", interaction.guild)],
            ephemeral: true
          });
        }

        const activeVC = await prisma.tempVC.findUnique({
          where: { channelId: voiceChannel.id }
        });

        if (!activeVC) {
          return interaction.reply({
            embeds: [UniversalEmbed.error("This is not a managed temporary voice channel.", interaction.guild)],
            ephemeral: true
          });
        }

        const ownerInChannel = voiceChannel.members.has(activeVC.ownerId);
        if (ownerInChannel) {
          return interaction.reply({
            embeds: [UniversalEmbed.error("The owner is currently in this channel.", interaction.guild)],
            ephemeral: true
          });
        }

        // Claim channel
        await prisma.tempVC.update({
          where: { channelId: voiceChannel.id },
          data: { ownerId: interaction.user.id }
        });

        // Set owner permission override
        await voiceChannel.permissionOverwrites.edit(interaction.user.id, {
          Connect: true,
          Speak: true,
          MuteMembers: true,
          DeafenMembers: true,
          MoveMembers: true
        });

        await interaction.reply({
          embeds: [UniversalEmbed.success(`👑 You have claimed ownership of this channel!`, interaction.guild)]
        });
      }
    } catch (error) {
      console.error("❌ Panel button interaction error:", error);
      await interaction.reply({
        embeds: [UniversalEmbed.error("An error occurred. Please make sure the bot has necessary permissions.", interaction.guild)],
        ephemeral: true
      }).catch(() => null);
    }
  }

  // 4. Handle Dropdown Select Menus
  else if (interaction.isUserSelectMenu()) {
    try {
      const targetUserId = interaction.values[0];
      const targetMember = interaction.guild.members.cache.get(targetUserId);

      if (!targetMember) {
        return interaction.update({
          content: "❌ Selected user not found in this server.",
          components: []
        });
      }

      if (customId === "tempvc_trust_select") {
        if (!channel) return;
        await channel.permissionOverwrites.edit(targetUserId, { Connect: true, ViewChannel: true, Speak: true });
        
        const trustedList = [...(dbVc?.trusted ?? []), targetUserId];
        await prisma.tempVC.update({
          where: { channelId: channel.id },
          data: { trusted: trustedList }
        });

        await interaction.update({
          content: `✅ Trusted **${targetMember.user.tag}** for this channel. They can now join and speak.`,
          components: []
        });
      }

      else if (customId === "tempvc_untrust_select") {
        if (!channel) return;
        await channel.permissionOverwrites.delete(targetUserId);
        
        const trustedList = (dbVc?.trusted ?? []).filter(id => id !== targetUserId);
        await prisma.tempVC.update({
          where: { channelId: channel.id },
          data: { trusted: trustedList }
        });

        await interaction.update({
          content: `✅ Removed trust from **${targetMember.user.tag}**.`,
          components: []
        });
      }

      else if (customId === "tempvc_kick_select") {
        if (!channel) return;
        if (targetMember.voice.channelId !== channel.id) {
          return interaction.update({
            content: `❌ **${targetMember.user.tag}** is not in your voice channel.`,
            components: []
          });
        }

        await targetMember.voice.disconnect("Kicked by owner");
        await interaction.update({
          content: `✅ Kicked **${targetMember.user.tag}** from the voice channel.`,
          components: []
        });
      }

      else if (customId === "tempvc_block_select") {
        if (!channel) return;
        await channel.permissionOverwrites.edit(targetUserId, { Connect: false });

        if (targetMember.voice.channelId === channel.id) {
          await targetMember.voice.disconnect("Blocked by owner");
        }

        const untrustedList = [...(dbVc?.untrusted ?? []), targetUserId];
        await prisma.tempVC.update({
          where: { channelId: channel.id },
          data: { untrusted: untrustedList }
        });

        await interaction.update({
          content: `✅ Blocked **${targetMember.user.tag}** from joining this channel.`,
          components: []
        });
      }

      else if (customId === "tempvc_transfer_select") {
        if (!channel) return;
        
        try {
          await channel.permissionOverwrites.delete(interaction.user.id);
        } catch {}

        await channel.permissionOverwrites.edit(targetUserId, {
          Connect: true,
          Speak: true,
          MuteMembers: true,
          DeafenMembers: true,
          MoveMembers: true
        });

        await prisma.tempVC.update({
          where: { channelId: channel.id },
          data: { ownerId: targetUserId }
        });

        await interaction.update({
          content: `👑 Transferred ownership of the channel to **${targetMember.user.tag}**.`,
          components: []
        });
      }
    } catch (error) {
      console.error("❌ Select menu interaction error:", error);
      await interaction.update({
        content: "❌ An error occurred. Make sure the bot has permissions.",
        components: []
      }).catch(() => null);
    }
  }

  // 5. Handle String Select Menus
  else if (interaction.isStringSelectMenu()) {
    try {
      const selectedValue = interaction.values[0];

      if (customId === "tempvc_region_select") {
        if (!channel) return;
        const region = selectedValue === "automatic" ? null : selectedValue;
        await channel.setRTCRegion(region);

        await interaction.update({
          content: `🌐 RTC region successfully updated to **${selectedValue}**.`,
          components: []
        });
      }
    } catch (error) {
      console.error("❌ String select menu interaction error:", error);
      await interaction.update({
        content: "❌ Failed to update region. Make sure the bot has server manage channel permissions.",
        components: []
      }).catch(() => null);
    }
  }

  // 6. Handle Modal Submissions
  else if (interaction.isModalSubmit()) {
    try {
      if (customId === "tempvc_rename_modal") {
        if (!channel) return;
        const newName = interaction.fields.getTextInputValue("tempvc_new_name");
        await channel.setName(newName);
        await prisma.tempVC.update({ where: { channelId: channel.id }, data: { name: newName } });
        await interaction.reply({ embeds: [UniversalEmbed.success(`Channel renamed to **${newName}**`, interaction.guild)], ephemeral: true });
      }

      else if (customId === "tempvc_limit_modal") {
        if (!channel) return;
        const limitStr = interaction.fields.getTextInputValue("tempvc_new_limit");
        const limit = parseInt(limitStr, 10);
        if (isNaN(limit) || limit < 0 || limit > 99) {
          return interaction.reply({ embeds: [UniversalEmbed.error("Please specify a valid limit (0-99).", interaction.guild)], ephemeral: true });
        }
        await channel.setUserLimit(limit);
        await prisma.tempVC.update({ where: { channelId: channel.id }, data: { limit } });
        await interaction.reply({ embeds: [UniversalEmbed.success(`User limit set to **${limit}**`, interaction.guild)], ephemeral: true });
      }
    } catch (error) {
      console.error("❌ Modal submission error:", error);
      await interaction.reply({
        embeds: [UniversalEmbed.error("An error occurred. Make sure the bot has permissions.", interaction.guild)],
        ephemeral: true
      }).catch(() => null);
    }
  }
}
