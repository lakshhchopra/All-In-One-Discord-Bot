import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType, 
  TextChannel, 
  WebhookClient, 
  AttachmentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  Guild
} from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";
import { redis } from "../../../services/redis.js";
import { EMOJIS } from "../../../config/emojis.js";
import { parseVariables, parseObjectVariables } from "../../../services/utils/parser.js";

// Helper to validate alphanumeric name
function isValidName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

export const embedCommand: Command = {
  name: "embed",
  description: "Manage and create custom embeds dynamically.",
  category: "Media",
  usage: "embed <create | edit | save | rename | send | post | export | import | list | show | delete> <name> [options]",
  examples: [
    "embed create rules",
    "embed send rules #general",
    "embed list",
    "embed show rules",
    "embed delete rules"
  ],
  execute: async (ctx) => {
    const subcommand = ctx.getStringOption("subcommand", 0)?.toLowerCase();
    const validSubcommands = ["create", "edit", "save", "rename", "send", "post", "export", "import", "list", "show", "delete"];

    if (!subcommand || !validSubcommands.includes(subcommand)) {
      const helpEmbed = new UniversalEmbed("info", undefined, ctx.guild)
        .setTitle(`${EMOJIS.media} Custom Embed System Help`)
        .setDescription(
          `Below is the list of all available subcommands in the custom embed system:\n\n` +
          `• \`embed list\` - List names of all saved custom embeds.\n` +
          `• \`embed show <name>\` - Display a preview of the saved embed with dynamic variables.\n` +
          `• \`embed create <name>\` - Start interactive modal-based editor to build a new embed.\n` +
          `• \`embed edit <name>\` - Modify an existing custom embed using modal forms.\n` +
          `• \`embed post/send <name> [channel]\` - Send the custom embed to a specific channel.\n` +
          `• \`embed save <name> [message_id]\` - Save an embed directly from an existing channel message.\n` +
          `• \`embed delete <name>\` - Delete a saved custom embed.\n` +
          `• \`embed rename <name> <new_name>\` - Rename a saved custom embed.\n` +
          `• \`embed export <name> <file/token>\` - Export embed configuration to a file or shareable token.\n` +
          `• \`embed import <name> [token]\` - Import embed configuration from a file attachment or token.`
        )
        .setFooter({ text: "Use these placeholders inside embeds: {user}, {server_name}, {server_icon}, etc." });
      return ctx.reply({ embeds: [helpEmbed] });
    }

    // 1. List saved embeds (doesn't require a name)
    if (subcommand === "list") {
      const embedsList = await prisma.savedEmbed.findMany({
        where: { guildId: ctx.guild.id }
      });

      if (embedsList.length === 0) {
        return ctx.reply({ embeds: [UniversalEmbed.info("No custom embeds have been saved in this server.", ctx.guild)] });
      }

      const listStr = embedsList.map(e => `• **${e.name}** - Created <t:${Math.floor(e.createdAt.getTime() / 1000)}:R>`).join("\n");
      const listEmbed = new UniversalEmbed("neutral", undefined, ctx.guild)
        .setTitle(`${EMOJIS.media} Saved Embeds`)
        .setDescription(listStr)
        .setFooter({ text: `Total Custom Embeds: ${embedsList.length}` });

      return ctx.reply({ embeds: [listEmbed] });
    }

    const name = ctx.getStringOption("name", 1)?.toLowerCase();

    if (!name) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a name for the embed.", ctx.guild)] }, 5);
    }

    if (!isValidName(name)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Embed name must be a single alphanumeric word (hyphens/underscores allowed).", ctx.guild)] }, 5);
    }

    // 2. Show specific embed
    if (subcommand === "show") {
      const saved = await prisma.savedEmbed.findUnique({
        where: { guildId_name: { guildId: ctx.guild.id, name } }
      });

      if (!saved) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` not found.`, ctx.guild)] }, 5);
      }

      const rawEmbedData = saved.embedData as any;
      const rawContent = saved.content || "";

      const parsedContent = parseVariables(rawContent, { user: ctx.member || ctx.user, guild: ctx.guild });
      const parsedEmbedData = parseObjectVariables(rawEmbedData, { user: ctx.member || ctx.user, guild: ctx.guild });

      return ctx.reply({ content: parsedContent || undefined, embeds: [parsedEmbedData] });
    }

    // 3. Delete Embed
    if (subcommand === "delete") {
      try {
        await prisma.savedEmbed.delete({
          where: { guildId_name: { guildId: ctx.guild.id, name } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully deleted saved embed \`${name}\`.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Embed \`${name}\` not found.`, ctx.guild)] }, 5);
      }
    }

    // 4. Rename Embed
    if (subcommand === "rename") {
      const newName = ctx.getStringOption("new_name", 2)?.toLowerCase();
      if (!newName || !isValidName(newName)) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a valid new alphanumeric name.", ctx.guild)] }, 5);
      }

      const exists = await prisma.savedEmbed.findUnique({
        where: { guildId_name: { guildId: ctx.guild.id, name } }
      });

      if (!exists) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` does not exist.`, ctx.guild)] }, 5);
      }

      const targetExists = await prisma.savedEmbed.findUnique({
        where: { guildId_name: { guildId: ctx.guild.id, name: newName } }
      });

      if (targetExists) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`An embed named \`${newName}\` already exists.`, ctx.guild)] }, 5);
      }

      await prisma.savedEmbed.update({
        where: { guildId_name: { guildId: ctx.guild.id, name } },
        data: { name: newName }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully renamed embed \`${name}\` to \`${newName}\`.`, ctx.guild)] });
    }

    // 5. Save Embed from existing message
    if (subcommand === "save") {
      let targetMessageId = ctx.getStringOption("message_id", 2);

      // Check if replying
      if (!targetMessageId && !ctx.isInteraction) {
        const message = ctx.source as any;
        if (message.reference && message.reference.messageId) {
          targetMessageId = message.reference.messageId;
        }
      }

      if (!targetMessageId) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please reply to a message containing the embed, or provide the message ID.", ctx.guild)] }, 5);
      }

      const channel = ctx.isInteraction ? ctx.source.channel : (ctx.source as any).channel;
      const targetMessage = await channel.messages.fetch(targetMessageId).catch(() => null);

      if (!targetMessage) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Could not find the target message in this channel.", ctx.guild)] }, 5);
      }

      const embedToSave = targetMessage.embeds[0];
      if (!embedToSave) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Target message does not contain any embeds.", ctx.guild)] }, 5);
      }

      const embedData = embedToSave.toJSON();

      await prisma.savedEmbed.upsert({
        where: { guildId_name: { guildId: ctx.guild.id, name } },
        create: {
          guildId: ctx.guild.id,
          name,
          content: targetMessage.content || null,
          embedData: embedData as any
        },
        update: {
          content: targetMessage.content || null,
          embedData: embedData as any
        }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully saved embed from message as \`${name}\`.`, ctx.guild)] });
    }

    // 6. Send / Post Embed
    if (subcommand === "send" || subcommand === "post") {
      const saved = await prisma.savedEmbed.findUnique({
        where: { guildId_name: { guildId: ctx.guild.id, name } }
      });

      if (!saved) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` not found.`, ctx.guild)] }, 5);
      }

      const rawEmbedData = saved.embedData as any;
      const rawContent = saved.content || "";

      const parsedContent = parseVariables(rawContent, { user: ctx.member || ctx.user, guild: ctx.guild });
      const parsedEmbedData = parseObjectVariables(rawEmbedData, { user: ctx.member || ctx.user, guild: ctx.guild });

      const targetChannelOption = ctx.getChannelOption("channel", 2);
      const targetChannel = (targetChannelOption as TextChannel) || (ctx.isInteraction ? ctx.source.channel : (ctx.source as any).channel);

      const webhookUrl = ctx.getStringOption("webhook_url", 3);
      const webhookName = ctx.getStringOption("webhook_name", 4);
      const webhookAvatar = ctx.getStringOption("webhook_avatar", 5);

      if (webhookUrl) {
        try {
          const webhook = new WebhookClient({ url: webhookUrl });
          await webhook.send({
            content: parsedContent || undefined,
            embeds: [parsedEmbedData],
            username: webhookName || undefined,
            avatarURL: webhookAvatar || undefined
          });
          return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully sent embed \`${name}\` via Webhook.`, ctx.guild)] });
        } catch (err: any) {
          return ctx.reply({ embeds: [UniversalEmbed.error(`Webhook execution failed: ${err.message}`, ctx.guild)] }, 5);
        }
      }

      if (targetChannel && "send" in targetChannel) {
        await targetChannel.send({ content: parsedContent || undefined, embeds: [parsedEmbedData] });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully sent embed \`${name}\` in ${targetChannel}.`, ctx.guild)] });
      }

      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid target channel.", ctx.guild)] }, 5);
    }

    // 7. Export Embed
    if (subcommand === "export") {
      const exportType = ctx.getStringOption("type", 2)?.toLowerCase();
      if (exportType !== "file" && exportType !== "token") {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify export type as either `file` or `token`.", ctx.guild)] }, 5);
      }

      const saved = await prisma.savedEmbed.findUnique({
        where: { guildId_name: { guildId: ctx.guild.id, name } }
      });

      if (!saved) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` not found.`, ctx.guild)] }, 5);
      }

      const payload = {
        name: saved.name,
        content: saved.content,
        embedData: saved.embedData
      };

      if (exportType === "file") {
        const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf-8");
        const attachment = new AttachmentBuilder(buffer, { name: `${name}_embed.json` });
        return ctx.reply({
          embeds: [UniversalEmbed.success(`Here is the exported file for \`${name}\`:`, ctx.guild)],
          files: [attachment]
        });
      }

      // Generate a temporary 15-minute token
      const token = Math.random().toString(36).substring(2, 10).toUpperCase();
      await redis.setex(`embed_token:${token}`, 900, JSON.stringify(payload));

      return ctx.reply({
        embeds: [UniversalEmbed.success(`🔑 **Token generated!** Use this to import: \`${token}\` (Expires in 15 minutes).`, ctx.guild)]
      });
    }

    // 8. Import Embed
    if (subcommand === "import") {
      const token = ctx.getStringOption("token", 2);
      let payload: any = null;

      if (token) {
        const cached = await redis.get(`embed_token:${token}`);
        if (!cached) {
          return ctx.reply({ embeds: [UniversalEmbed.error("Invalid or expired import token.", ctx.guild)] }, 5);
        }
        try {
          payload = JSON.parse(cached);
        } catch {}
      } else if (!ctx.isInteraction) {
        const message = ctx.source as any;
        const attachment = message.attachments?.first();
        if (attachment) {
          try {
            const response = await fetch(attachment.url);
            payload = await response.json();
          } catch {
            return ctx.reply({ embeds: [UniversalEmbed.error("Failed to parse the attached JSON file.", ctx.guild)] }, 5);
          }
        }
      }

      if (!payload || !payload.embedData) {
        return ctx.reply({ embeds: [UniversalEmbed.error("No valid import token or JSON attachment found.", ctx.guild)] }, 5);
      }

      await prisma.savedEmbed.upsert({
        where: { guildId_name: { guildId: ctx.guild.id, name } },
        create: {
          guildId: ctx.guild.id,
          name,
          content: payload.content || null,
          embedData: payload.embedData
        },
        update: {
          content: payload.content || null,
          embedData: payload.embedData
        }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully imported embed config as \`${name}\`!`, ctx.guild)] });
    }

    // 9. Create or Edit (Interactive Modal-based Builder)
    if (subcommand === "create" || subcommand === "edit") {
      let draftEmbed: any = {
        title: "Draft Title",
        description: "Draft Description",
        color: 0x00ff87
      };
      let draftContent: string | null = null;

      if (subcommand === "edit") {
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
        content: draftContent || undefined,
        embeds: [draftEmbed],
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
            filter: (i) => i.user.id === ctx.user.id,
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

            await response.edit({
              content: draftContent || undefined,
              embeds: [draftEmbed],
              components: getBuilderComponents() as any
            });

            await (submitted as any).deferUpdate();
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
            filter: (i) => i.user.id === ctx.user.id,
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

            await response.edit({
              content: draftContent || undefined,
              embeds: [draftEmbed],
              components: getBuilderComponents() as any
            });

            await (submitted as any).deferUpdate();
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
            filter: (i) => i.user.id === ctx.user.id,
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

            await response.edit({
              content: draftContent || undefined,
              embeds: [draftEmbed],
              components: getBuilderComponents() as any
            });

            await (submitted as any).deferUpdate();
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
            filter: (i) => i.user.id === ctx.user.id,
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

            await response.edit({
              content: draftContent || undefined,
              embeds: [draftEmbed],
              components: getBuilderComponents() as any
            });

            await (submitted as any).deferUpdate();
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
  }
};
