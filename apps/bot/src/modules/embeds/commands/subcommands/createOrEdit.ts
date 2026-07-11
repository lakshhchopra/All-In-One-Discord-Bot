import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ModalBuilder, 
  TextInputBuilder, 
  TextInputStyle 
} from "discord.js";
import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { parseVariables, parseObjectVariables } from "../../../../services/utils/parser.js";

export async function executeCreateOrEdit(ctx: CommandContext, name: string, isEdit: boolean) {
  let draftEmbed: any = {
    title: "Draft Title",
    description: "Draft Description",
    color: 0x00ff87
  };
  let draftContent: string | null = null;

  if (isEdit) {
    const saved = await prisma.savedEmbed.findUnique({
      where: { guildId_name: { guildId: ctx.guild.id, name } }
    });
    if (!saved) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`Embed \`${name}\` not found for editing.`, ctx.guild)] }, 5);
    }
    draftEmbed = saved.embedData;
    draftContent = saved.content;
  } else {
    // Create - check if already exists
    const exists = await prisma.savedEmbed.findUnique({
      where: { guildId_name: { guildId: ctx.guild.id, name } }
    });
    if (exists) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`An embed named \`${name}\` already exists. Use \`edit\` to modify it.`, ctx.guild)] }, 5);
    }
  }

  const getBuilderComponents = () => {
    const row1 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("embed_edit_main").setLabel("edit color / title / description").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("embed_edit_author").setLabel("edit author").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("embed_edit_footer").setLabel("edit footer").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("embed_edit_images").setLabel("edit images").setStyle(ButtonStyle.Secondary)
    );

    const row2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId("embed_save").setLabel("Save").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("embed_cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
    );

    return [row1, row2];
  };

  const response = await ctx.reply({
    content: draftContent ? parseVariables(draftContent, { user: ctx.member || ctx.user, guild: ctx.guild }) : undefined,
    embeds: [parseObjectVariables(draftEmbed, { user: ctx.member || ctx.user, guild: ctx.guild })],
    components: getBuilderComponents() as any
  });

  if (!response) return;

  const collector = response.createMessageComponentCollector({
    time: 600000 // 10 minutes timeout
  });

  collector.on("collect", async (interaction) => {
    if (interaction.user.id !== ctx.user.id) {
      return interaction.reply({ content: "❌ You cannot control this session.", ephemeral: true });
    }

    const id = interaction.customId;

    // Handle Save/Cancel
    if (id === "embed_save") {
      await prisma.savedEmbed.upsert({
        where: { guildId_name: { guildId: ctx.guild.id, name } },
        create: {
          guildId: ctx.guild.id,
          name,
          content: draftContent,
          embedData: draftEmbed
        },
        update: {
          content: draftContent,
          embedData: draftEmbed
        }
      });
      collector.stop("saved");
      await interaction.update({
        content: `✅ **Successfully saved embed \`${name}\`!**`,
        embeds: [],
        components: []
      });
      return;
    }

    if (id === "embed_cancel") {
      collector.stop("cancelled");
      await interaction.update({
        content: `❌ **Discarded embed draft changes.**`,
        embeds: [],
        components: []
      });
      return;
    }

    // Handle Modal-Based Edit button interactions
    if (id === "embed_edit_main") {
      const modal = new ModalBuilder()
        .setCustomId("modal_main")
        .setTitle(`Editing: ${name}`);

      const titleInput = new TextInputBuilder()
        .setCustomId("modal_title")
        .setLabel("Title")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.title || "")
        .setRequired(false);

      const descInput = new TextInputBuilder()
        .setCustomId("modal_description")
        .setLabel("Description")
        .setStyle(TextInputStyle.Paragraph)
        .setValue(draftEmbed.description || "")
        .setRequired(false);

      const colorInput = new TextInputBuilder()
        .setCustomId("modal_color")
        .setLabel("Hex Color")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.color ? draftEmbed.color.toString(16).padStart(6, "0") : "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(titleInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(descInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(colorInput)
      );

      await interaction.showModal(modal);

      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === ctx.user.id && i.customId === "modal_main",
        time: 180000
      }).catch(() => null);

      if (submitted) {
        draftEmbed.title = submitted.fields.getTextInputValue("modal_title") || undefined;
        draftEmbed.description = submitted.fields.getTextInputValue("modal_description") || undefined;
        const colorStr = submitted.fields.getTextInputValue("modal_color") || "";
        if (colorStr) {
          const hexVal = colorStr.replace("#", "");
          const parsedColor = parseInt(hexVal, 16);
          if (!isNaN(parsedColor)) {
            draftEmbed.color = parsedColor;
          }
        } else {
          delete draftEmbed.color;
        }

        await (submitted as any).deferUpdate().catch(() => null);
        await response.edit({
          content: draftContent ? parseVariables(draftContent, { user: ctx.member || ctx.user, guild: ctx.guild }) : undefined,
          embeds: [parseObjectVariables(draftEmbed, { user: ctx.member || ctx.user, guild: ctx.guild })],
          components: getBuilderComponents() as any
        });
      }
      return;
    }

    if (id === "embed_edit_author") {
      const modal = new ModalBuilder()
        .setCustomId("modal_author")
        .setTitle(`Editing: ${name}`);

      const nameInput = new TextInputBuilder()
        .setCustomId("modal_author_name")
        .setLabel("Author Text")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.author?.name || "")
        .setRequired(false);

      const iconInput = new TextInputBuilder()
        .setCustomId("modal_author_icon")
        .setLabel("Author Image (optional)")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.author?.icon_url || "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(nameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(iconInput)
      );

      await interaction.showModal(modal);

      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === ctx.user.id && i.customId === "modal_author",
        time: 180000
      }).catch(() => null);

      if (submitted) {
        const authorName = submitted.fields.getTextInputValue("modal_author_name") || "";
        const authorIcon = submitted.fields.getTextInputValue("modal_author_icon") || "";
        if (authorName) {
          draftEmbed.author = {
            name: authorName,
            icon_url: authorIcon || undefined
          };
        } else {
          delete draftEmbed.author;
        }

        await (submitted as any).deferUpdate().catch(() => null);
        await response.edit({
          content: draftContent ? parseVariables(draftContent, { user: ctx.member || ctx.user, guild: ctx.guild }) : undefined,
          embeds: [parseObjectVariables(draftEmbed, { user: ctx.member || ctx.user, guild: ctx.guild })],
          components: getBuilderComponents() as any
        });
      }
      return;
    }

    if (id === "embed_edit_footer") {
      const modal = new ModalBuilder()
        .setCustomId("modal_footer")
        .setTitle(`Editing: ${name}`);

      const textInput = new TextInputBuilder()
        .setCustomId("modal_footer_text")
        .setLabel("Footer Text")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.footer?.text || "")
        .setRequired(false);

      const iconInput = new TextInputBuilder()
        .setCustomId("modal_footer_icon")
        .setLabel("Footer Image (optional)")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.footer?.icon_url || "")
        .setRequired(false);

      const tsInput = new TextInputBuilder()
        .setCustomId("modal_footer_timestamp")
        .setLabel("Timestamp? (yes/no)")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.timestamp ? "yes" : "no")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(textInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(iconInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(tsInput)
      );

      await interaction.showModal(modal);

      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === ctx.user.id && i.customId === "modal_footer",
        time: 180000
      }).catch(() => null);

      if (submitted) {
        const textVal = submitted.fields.getTextInputValue("modal_footer_text") || "";
        const iconVal = submitted.fields.getTextInputValue("modal_footer_icon") || "";
        const tsVal = submitted.fields.getTextInputValue("modal_footer_timestamp") || "";

        if (textVal) {
          draftEmbed.footer = {
            text: textVal,
            icon_url: iconVal || undefined
          };
        } else {
          delete draftEmbed.footer;
        }

        if (tsVal.toLowerCase() === "yes") {
          draftEmbed.timestamp = new Date().toISOString();
        } else {
          delete draftEmbed.timestamp;
        }

        await (submitted as any).deferUpdate().catch(() => null);
        await response.edit({
          content: draftContent ? parseVariables(draftContent, { user: ctx.member || ctx.user, guild: ctx.guild }) : undefined,
          embeds: [parseObjectVariables(draftEmbed, { user: ctx.member || ctx.user, guild: ctx.guild })],
          components: getBuilderComponents() as any
        });
      }
      return;
    }

    if (id === "embed_edit_images") {
      const modal = new ModalBuilder()
        .setCustomId("modal_images")
        .setTitle(`Editing: ${name}`);

      const mainImageInput = new TextInputBuilder()
        .setCustomId("modal_image_url")
        .setLabel("Main Image")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.image?.url || "")
        .setRequired(false);

      const thumbnailInput = new TextInputBuilder()
        .setCustomId("modal_thumbnail_url")
        .setLabel("Thumbnail")
        .setStyle(TextInputStyle.Short)
        .setValue(draftEmbed.thumbnail?.url || "")
        .setRequired(false);

      modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(mainImageInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(thumbnailInput)
      );

      await interaction.showModal(modal);

      const submitted = await interaction.awaitModalSubmit({
        filter: (i) => i.user.id === ctx.user.id && i.customId === "modal_images",
        time: 180000
      }).catch(() => null);

      if (submitted) {
        const imgUrl = submitted.fields.getTextInputValue("modal_image_url") || "";
        const thumbnailUrl = submitted.fields.getTextInputValue("modal_thumbnail_url") || "";

        if (imgUrl) {
          draftEmbed.image = { url: imgUrl };
        } else {
          delete draftEmbed.image;
        }

        if (thumbnailUrl) {
          draftEmbed.thumbnail = { url: thumbnailUrl };
        } else {
          delete draftEmbed.thumbnail;
        }

        await (submitted as any).deferUpdate().catch(() => null);
        await response.edit({
          content: draftContent ? parseVariables(draftContent, { user: ctx.member || ctx.user, guild: ctx.guild }) : undefined,
          embeds: [parseObjectVariables(draftEmbed, { user: ctx.member || ctx.user, guild: ctx.guild })],
          components: getBuilderComponents() as any
        });
      }
      return;
    }
  });

  collector.on("end", async (_, reason) => {
    if (reason !== "saved" && reason !== "cancelled") {
      try {
        await response.edit({
          content: `⚠️ **Embed builder session timed out.**`,
          embeds: [],
          components: []
        });
      } catch {}
    }
  });
}
