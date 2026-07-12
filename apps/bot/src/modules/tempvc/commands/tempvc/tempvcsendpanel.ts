import { Command } from "../../../../commands/command.js";
import { ChannelType, AttachmentBuilder } from "discord.js";
import path from "path";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { hasPermission } from "../../../../commands/permissions.js";
import { getTempVcPanelRows } from "../../panel.js";

export const tempvcsendpanelCommand: Command = {
  name: "tempvcsendpanel",
  aliases: ["tempvc sendpanel"],
  description: "Post the persistent controller panel.",
  category: "Temporary Voice",
  permissionLevel: "ADMIN",
  usage: "tempvc sendpanel [channel]",
  execute: async (ctx: any) => {
    const isAdmin = await hasPermission(ctx.member, "ADMIN");
    if (!isAdmin) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need Administrator permissions to configure temporary voice channels.", ctx.guild)] }, 5);
    }

    const targetChannel = (ctx.getChannelOption("channel", 0) || ctx.channel);
    if (!targetChannel || (targetChannel.type !== ChannelType.GuildText && targetChannel.type !== ChannelType.GuildAnnouncement)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid text channel to send the control panel.", ctx.guild)] }, 5);
    }

    const imagePath = path.join(process.cwd(), "apps/bot/src/assets/tempvc_panel.png");
    const attachment = new AttachmentBuilder(imagePath, { name: "tempvc_panel.png" });

    const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
      .setTitle("TempVoice Interface")
      .setDescription(
        `This **interface** can be used to manage temporary voice channels.\n` +
        `More options are available with **/voice** commands.\n\n` +
        `Press the buttons below to use the interface`
      )
      .setImage("attachment://tempvc_panel.png")
      .setColor(0xFF0055);

    const components = getTempVcPanelRows();

    try {
      await (targetChannel as any).send({ embeds: [embed], files: [attachment], components });
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { tempVcInterfaceId: targetChannel.id },
        create: { guildId: ctx.guild.id, tempVcInterfaceId: targetChannel.id }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Interactive VC control panel successfully sent to ${targetChannel}.`, ctx.guild)] });
    } catch (err) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to send panel. Ensure the bot has Send Messages and Embed Links permissions in that channel.", ctx.guild)] });
    }
  }
};

