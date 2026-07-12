import { Command } from "../../../../commands/command.js";
import { ChannelType, AttachmentBuilder } from "discord.js";
import path from "path";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { hasPermission } from "../../../../commands/permissions.js";
import { getTempVcPanelRows } from "../../panel.js";

export const tempvcsetupCommand: Command = {
  name: "tempvcsetup",
  aliases: ["tempvc setup"],
  description: "Automatically setups category, generator and interface for Temp VCs.",
  category: "Temporary Voice",
  permissionLevel: "ADMIN",
  usage: "tempvc setup",
  execute: async (ctx: any) => {
    const isAdmin = await hasPermission(ctx.member, "ADMIN");
    if (!isAdmin) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need Administrator permissions to configure temporary voice channels.", ctx.guild)] }, 5);
    }

    try {
      // 1. Create a Category Channel named "🔊 Temp Voice"
      const category = await ctx.guild.channels.create({
        name: "🔊 Temp Voice",
        type: ChannelType.GuildCategory
      });

      // 2. Create Voice Channel inside category: "➕ Join to Create"
      const voiceCh = await ctx.guild.channels.create({
        name: "➕ Join to Create",
        type: ChannelType.GuildVoice,
        parent: category.id
      });

      // 3. Create Text Channel inside category: "✨・interface"
      const textCh = await ctx.guild.channels.create({
        name: "✨・interface",
        type: ChannelType.GuildText,
        parent: category.id
      });

      // 4. Save both in database
      await (prisma as any).tempVCGenerator.upsert({
        where: { channelId: voiceCh.id },
        update: {
          nameTemplate: "{username}'s Channel",
          userLimit: 0,
          categoryId: category.id
        },
        create: {
          channelId: voiceCh.id,
          guildId: ctx.guild.id,
          nameTemplate: "{username}'s Channel",
          userLimit: 0,
          categoryId: category.id
        }
      });

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { tempVcInterfaceId: textCh.id },
        create: { guildId: ctx.guild.id, tempVcInterfaceId: textCh.id }
      });

      // 5. Send persistent control panel to the interface text channel
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
      await textCh.send({ embeds: [embed], files: [attachment], components });

      // 6. Return beautiful confirmation embed matching moderation UI
      const setupEmbed = UniversalEmbed.success(
        `**Temp VC System Setup Completed!**\n\n` +
        `• **Category Created:** ${category}\n` +
        `• **Generator Channel:** ${voiceCh} \n` +
        `• **Interface Channel:** ${textCh} *(Control Panel sent!)*\n\n` +
        `*Users can now join the generator channel to create their own custom voice channels.*`,
        ctx.guild
      ).setTitle("🔊 TempVC Setup Success");

      return ctx.reply({ embeds: [setupEmbed] });
    } catch (err) {
      console.error("❌ TempVC auto-setup failed:", err);
      return ctx.reply({ embeds: [UniversalEmbed.error("An error occurred during automatic setup. Ensure the bot has Manage Channels permissions.", ctx.guild)] });
    }
  }
};

