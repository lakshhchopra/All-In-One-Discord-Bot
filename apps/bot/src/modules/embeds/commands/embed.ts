import { 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  ComponentType, 
  StringSelectMenuBuilder, 
  TextChannel, 
  WebhookClient, 
  AttachmentBuilder,
  Guild
} from "discord.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";
import { redis } from "../../../services/redis.js";
import { EMOJIS, getEmojiUrl } from "../../../config/emojis.js";

// Helper to validate alphanumeric name
function isValidName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

export const embedCommand: Command = {
  name: "embed",
  description: "Manage and create custom embeds dynamically.",
  category: "Media",
  usage: "embed <create | edit | save | rename | send | export | import | show | delete> <name> [options]",
  examples: [
    "embed create rules",
    "embed send rules #general",
    "embed save welcome",
    "embed delete rules"
  ],
  execute: async (ctx) => {
    const subcommand = ctx.getStringOption("subcommand", 0)?.toLowerCase();

    if (!subcommand) {
      return ctx.wrongUsage(embedCommand);
    }

    const name = ctx.getStringOption("name", 1)?.toLowerCase();

    // 1. Show all saved embeds
    if (subcommand === "show") {
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

    if (!name) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a name for the embed.", ctx.guild)] }, 5);
    }

    if (!isValidName(name)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Embed name must be a single alphanumeric word (hyphens/underscores allowed).", ctx.guild)] }, 5);
    }

    // 2. Delete Embed
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

    // 3. Rename Embed
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

    // 4. Save Embed from existing message
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

    // 5. Send Embed
    if (subcommand === "send") {
      const saved = await prisma.savedEmbed.findUnique({
        where: { guildId_name: { guildId: ctx.guild.id, name } }
      });

      if (!saved) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` not found.`, ctx.guild)] }, 5);
      }

      const embedData = saved.embedData as any;
      const content = saved.content || undefined;

      const targetChannelOption = ctx.getChannelOption("channel", 2);
      const targetChannel = (targetChannelOption as TextChannel) || (ctx.isInteraction ? ctx.source.channel : (ctx.source as any).channel);

      const webhookUrl = ctx.getStringOption("webhook_url", 3);
      const webhookName = ctx.getStringOption("webhook_name", 4);
      const webhookAvatar = ctx.getStringOption("webhook_avatar", 5);

      if (webhookUrl) {
        try {
          const webhook = new WebhookClient({ url: webhookUrl });
          await webhook.send({
            content,
            embeds: [embedData],
            username: webhookName || undefined,
            avatarURL: webhookAvatar || undefined
          });
          return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully sent embed \`${name}\` via Webhook.`, ctx.guild)] });
        } catch (err: any) {
          return ctx.reply({ embeds: [UniversalEmbed.error(`Webhook execution failed: ${err.message}`, ctx.guild)] }, 5);
        }
      }

      if (targetChannel && "send" in targetChannel) {
        await targetChannel.send({ content, embeds: [embedData] });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully sent embed \`${name}\` in ${targetChannel}.`, ctx.guild)] });
      }

      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid target channel.", ctx.guild)] }, 5);
    }

    // 6. Export Embed
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

    // 7. Import Embed
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

    // 8. Create or Edit (Interactive Builder)
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
        const menu = new StringSelectMenuBuilder()
          .setCustomId("builder_menu")
          .setPlaceholder("Select a component to edit...")
          .addOptions([
            { label: "Edit Title", value: "title", description: "Set the embed header title" },
            { label: "Edit Description", value: "description", description: "Set the embed main description text" },
            { label: "Edit Color", value: "color", description: "Set the accent line color (Hex code)" },
            { label: "Edit Content", value: "content", description: "Set standard plain text above the embed" },
            { label: "Edit Image", value: "image", description: "Set main cover image URL" },
            { label: "Edit Thumbnail", value: "thumbnail", description: "Set corner thumbnail image URL" },
            { label: "Edit Author Info", value: "author", description: "Format: Name | Icon URL" },
            { label: "Edit Footer Info", value: "footer", description: "Format: Text | Icon URL" },
            { label: "Add Field", value: "addfield", description: "Format: Name | Value | Inline(true/false)" },
            { label: "Delete Field", value: "delfield", description: "Delete a field by index number" }
          ]);

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setCustomId("builder_save").setLabel("Save").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("builder_cancel").setLabel("Cancel").setStyle(ButtonStyle.Danger)
        );

        return [
          new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu),
          buttons
        ];
      };

      const response = await ctx.reply({
        content: draftContent || undefined,
        embeds: [draftEmbed],
        components: getBuilderComponents() as any
      });

      if (!response) return;

      const collector = response.createMessageComponentCollector({
        time: 300000 // 5 minutes timeout
      });

      collector.on("collect", async (interaction) => {
        if (interaction.user.id !== ctx.user.id) {
          return interaction.reply({ content: "❌ You cannot control this session.", ephemeral: true });
        }

        // Handle Save/Cancel Buttons
        if (interaction.isButton()) {
          if (interaction.customId === "builder_save") {
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
          } else if (interaction.customId === "builder_cancel") {
            collector.stop("cancelled");
            await interaction.update({
              content: `❌ **Discarded embed draft changes.**`,
              embeds: [],
              components: []
            });
          }
          return;
        }

        // Handle Dropdown Menu Selections
        if (interaction.isStringSelectMenu() && interaction.customId === "builder_menu") {
          const selected = interaction.values[0];

          await interaction.reply({
            content: `💬 **Please type the new value for \`${selected}\` in the chat:**\n*(or type \`cancel\` to abort)*`,
            ephemeral: true
          });

          const msgCollector = (interaction.channel as any)?.createMessageCollector({
            filter: (m: any) => m.author.id === ctx.user.id,
            max: 1,
            time: 60000
          });

          msgCollector?.on("collect", async (m: any) => {
            const val = m.content.trim();
            
            // Delete user message to keep chat tidy
            try {
              await m.delete();
            } catch {}

            if (val.toLowerCase() === "cancel") {
              await interaction.followUp({ content: "❌ Edit cancelled.", ephemeral: true });
              return;
            }

            // Parse inputs based on field
            if (selected === "title") {
              draftEmbed.title = val;
            } else if (selected === "description") {
              draftEmbed.description = val;
            } else if (selected === "color") {
              const hexVal = val.replace("#", "");
              const parsedColor = parseInt(hexVal, 16);
              if (isNaN(parsedColor)) {
                await interaction.followUp({ content: "❌ Invalid Hex Color. Use format `#FF00FF`.", ephemeral: true });
                return;
              }
              draftEmbed.color = parsedColor;
            } else if (selected === "content") {
              draftContent = val === "none" ? null : val;
            } else if (selected === "image") {
              draftEmbed.image = { url: val };
            } else if (selected === "thumbnail") {
              draftEmbed.thumbnail = { url: val };
            } else if (selected === "author") {
              const parts = val.split("|");
              draftEmbed.author = {
                name: parts[0]?.trim(),
                icon_url: parts[1]?.trim() || undefined
              };
            } else if (selected === "footer") {
              const parts = val.split("|");
              draftEmbed.footer = {
                text: parts[0]?.trim(),
                icon_url: parts[1]?.trim() || undefined
              };
            } else if (selected === "addfield") {
              const parts = val.split("|");
              const isInline = parts[2]?.trim().toLowerCase() === "true";
              if (!draftEmbed.fields) draftEmbed.fields = [];
              draftEmbed.fields.push({
                name: parts[0]?.trim() || "Field Name",
                value: parts[1]?.trim() || "Field Value",
                inline: isInline
              });
            } else if (selected === "delfield") {
              const index = parseInt(val, 10);
              if (isNaN(index) || !draftEmbed.fields || !draftEmbed.fields[index]) {
                await interaction.followUp({ content: "❌ Invalid field index number.", ephemeral: true });
                return;
              }
              draftEmbed.fields.splice(index, 1);
            }

            // Update original preview message
            await response.edit({
              content: draftContent || undefined,
              embeds: [draftEmbed],
              components: getBuilderComponents() as any
            });

            await interaction.followUp({ content: `✅ Updated \`${selected}\`!`, ephemeral: true });
          });
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
