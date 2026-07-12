import { Command } from "../../../commands/command.js";
import { VoiceChannel, ChannelType, PermissionFlagsBits, AttachmentBuilder } from "discord.js";
import path from "path";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { hasPermission } from "../../../commands/permissions.js";
import { getTempVcPanelRows } from "../panel.js";

export const tempvcCommand: Command = {
  name: "tempvc",
  description: "Manage temporary voice channels and configurations.",
  category: "Temporary Voice",
  aliases: ["tvc", "voice", "tempvoice"],
  usage: "tempvc <lock | unlock | hide | unhide | rename | limit | trust | untrust | kick | claim | transfer | sendpanel | generator>",
  examples: [
    "tempvc lock",
    "tempvc unlock",
    "tempvc hide",
    "tempvc rename Chill Zone",
    "tempvc limit 5",
    "tempvc trust @member",
    "tempvc untrust @member",
    "tempvc kick @member",
    "tempvc transfer @member",
    "tempvc claim",
    "tempvc sendpanel #voice-control",
    "tempvc generator add #Join-To-Create 2 {user}'s Duo #Voice-Category",
    "tempvc generator remove #Join-To-Create",
    "tempvc generator list"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = new UniversalEmbed("info", undefined, ctx.guild)
        .setTitle("🔊 Temporary Voice Channels Help")
        .setDescription(
          `Manage your custom temporary voice channels using the commands below:\n\n` +
          `**User Commands:**\n` +
          `• \`${ctx.prefix}tempvc name <name>\` - Rename your voice channel.\n` +
          `• \`${ctx.prefix}tempvc region <region>\` - Change voice channel region.\n` +
          `• \`${ctx.prefix}tempvc lock\` - Lock the VC so only trusted users can join.\n` +
          `• \`${ctx.prefix}tempvc unlock\` - Unlock the VC for everyone.\n` +
          `• \`${ctx.prefix}tempvc hide\` - Hide the VC from the channel list.\n` +
          `• \`${ctx.prefix}tempvc unhide\` - Make the VC visible to everyone.\n` +
          `• \`${ctx.prefix}tempvc claim\` - Claim ownership of an empty owner's VC.\n` +
          `• \`${ctx.prefix}tempvc transfer <@member>\` - Hand over channel ownership.\n` +
          `• \`${ctx.prefix}tempvc kick <@member>\` - Kick a user from your voice channel.\n` +
          `• \`${ctx.prefix}tempvc limit <number>\` - Change user limit (0 to 99).\n` +
          `• \`${ctx.prefix}tempvc block <@member>\` - Block a user from joining.\n` +
          `• \`${ctx.prefix}tempvc trust <@member>\` - Trust a user to join while locked.\n` +
          `• \`${ctx.prefix}tempvc untrust <@member>\` - Remove trust from a user.\n\n` +
          `**Admin Configuration Commands:**\n` +
          `• \`${ctx.prefix}tempvc setup\` - Automatically setups category, generator and interface.\n` +
          `• \`${ctx.prefix}tempvc sendpanel [channel]\` - Post the persistent controller panel.\n` +
          `• \`${ctx.prefix}tempvc generator add <voiceCh> <limit> <nameTemplate> [category]\` - Register a generator.\n` +
          `• \`${ctx.prefix}tempvc generator remove <voiceCh>\` - Unregister a generator.\n` +
          `• \`${ctx.prefix}tempvc generator list\` - List all registered generators.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    // ----------------------------------------------------
    // ADMIN COMMANDS: setup, sendpanel, generator
    // ----------------------------------------------------
    if (["setup", "sendpanel", "generator"].includes(action)) {
      const isAdmin = await hasPermission(ctx.member, "ADMIN");
      if (!isAdmin) {
        return ctx.reply({ embeds: [UniversalEmbed.error("You need Administrator permissions to configure temporary voice channels.", ctx.guild)] }, 5);
      }

      if (action === "setup") {
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

      if (action === "sendpanel") {
        const targetChannel = (ctx.getChannelOption("channel", 1) || ctx.channel);
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

      if (action === "generator") {
        const subAction = ctx.getStringOption("subaction", 1)?.toLowerCase();

        if (subAction === "add") {
          const vCh = ctx.getChannelOption("channel", 2);
          if (!vCh || vCh.type !== ChannelType.GuildVoice) {
            return ctx.reply({ embeds: [UniversalEmbed.error(`Usage: \`${ctx.prefix}tempvc generator add <voiceCh> <limit> <nameTemplate> [category]\``, ctx.guild)] }, 5);
          }

          const limit = ctx.getIntegerOption("limit", 3);
          if (limit === null || limit < 0 || limit > 99) {
            return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid default user limit (0-99).", ctx.guild)] }, 5);
          }

          let nameTemplate = "";
          let categoryId: string | null = null;
          
          const remainingArgs = ctx.args.slice(4);
          if (remainingArgs.length > 0) {
            const lastArg = remainingArgs[remainingArgs.length - 1];
            const categoryMatch = lastArg.match(/^<#(\d+)>$/) || lastArg.match(/^(\d{17,20})$/);
            if (categoryMatch) {
              categoryId = categoryMatch[1];
              nameTemplate = remainingArgs.slice(0, -1).join(" ");
            } else {
              nameTemplate = remainingArgs.join(" ");
            }
          }

          if (!nameTemplate) {
            nameTemplate = "{username}'s Channel";
          }

          // Verify category if specified
          if (categoryId) {
            const catChannel = ctx.guild.channels.cache.get(categoryId);
            if (!catChannel || catChannel.type !== ChannelType.GuildCategory) {
              return ctx.reply({ embeds: [UniversalEmbed.error("The specified category channel ID/mention is invalid.", ctx.guild)] }, 5);
            }
          }

          await (prisma as any).tempVCGenerator.upsert({
            where: { channelId: vCh.id },
            update: {
              nameTemplate,
              userLimit: limit,
              categoryId
            },
            create: {
              channelId: vCh.id,
              guildId: ctx.guild.id,
              nameTemplate,
              userLimit: limit,
              categoryId
            }
          });

          return ctx.reply({
            embeds: [UniversalEmbed.success(
              `Successfully registered generator **${vCh.name}**!\n` +
              `• Default Limit: \`${limit === 0 ? "Unlimited" : limit}\`\n` +
              `• Name Template: \`${nameTemplate}\`\n` +
              `• Target Category: ${categoryId ? `<#${categoryId}>` : "Default (Generator's Parent)"}`,
              ctx.guild
            )]
          });
        }

        if (subAction === "remove" || subAction === "delete") {
          const vCh = ctx.getChannelOption("channel", 2);
          if (!vCh) {
            return ctx.reply({ embeds: [UniversalEmbed.error(`Usage: \`${ctx.prefix}tempvc generator remove <voiceCh>\``, ctx.guild)] }, 5);
          }

          const existing = await (prisma as any).tempVCGenerator.findUnique({
            where: { channelId: vCh.id }
          });

          if (!existing) {
            return ctx.reply({ embeds: [UniversalEmbed.error("That channel is not a registered temporary voice generator.", ctx.guild)] }, 5);
          }

          await (prisma as any).tempVCGenerator.delete({
            where: { channelId: vCh.id }
          });

          return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${vCh.name}** from temporary voice generators.`, ctx.guild)] });
        }

        if (subAction === "list") {
          const list = await (prisma as any).tempVCGenerator.findMany({
            where: { guildId: ctx.guild.id }
          });

          if (list.length === 0) {
            return ctx.reply({ embeds: [UniversalEmbed.info("There are no voice generators registered on this server.", ctx.guild)] });
          }

          const desc = list.map((gen: any, idx: number) => {
            const catVal = gen.categoryId ? `<#${gen.categoryId}>` : "*None (Default category)*";
            const limitVal = gen.userLimit === 0 ? "Unlimited" : `\`${gen.userLimit} Users\``;
            return `**#${idx + 1} ・ <#${gen.channelId}>**\n` +
                   `> 📂 **Category:** ${catVal}\n` +
                   `> 📝 **Template:** \`${gen.nameTemplate}\`\n` +
                   `> 👥 **Limit:** ${limitVal}`;
          }).join("\n\n");

          const embed = new UniversalEmbed("info", undefined, ctx.guild)
            .setTitle("🔊 Temp VC Generators")
            .setDescription(desc);

          return ctx.reply({ embeds: [embed] });
        }

        return ctx.reply({ embeds: [UniversalEmbed.error(`Invalid generator action. Use: \`add\`, \`remove\`, \`list\``, ctx.guild)] }, 5);
      }
    }

    // ----------------------------------------------------
    // USER COMMANDS: lock, unlock, hide, unhide, rename, limit, trust, untrust, kick, claim, transfer
    // ----------------------------------------------------
    
    // Get target channel where member is currently connected
    const memberVoiceChannel = ctx.member.voice.channel;
    if (!memberVoiceChannel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not in a voice channel.", ctx.guild)] }, 5);
    }

    // Lookup temp vc in database
    const dbVc = await prisma.tempVC.findUnique({
      where: { channelId: memberVoiceChannel.id }
    });

    if (!dbVc) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This is not a managed temporary voice channel.", ctx.guild)] }, 5);
    }

    const isOwner = dbVc.ownerId === ctx.user.id;

    if (action === "claim") {
      // If current owner is in the channel, cannot claim
      const ownerInChannel = memberVoiceChannel.members.has(dbVc.ownerId);
      if (ownerInChannel) {
        return ctx.reply({ embeds: [UniversalEmbed.error("The owner is currently in this channel.", ctx.guild)] }, 5);
      }

      await prisma.tempVC.update({
        where: { channelId: memberVoiceChannel.id },
        data: { ownerId: ctx.user.id }
      });

      // Give new owner permission overrides
      await memberVoiceChannel.permissionOverwrites.edit(ctx.user.id, {
        Connect: true,
        Speak: true,
        MuteMembers: true,
        DeafenMembers: true,
        MoveMembers: true
      });

      return ctx.reply({ embeds: [UniversalEmbed.success("You have claimed ownership of this channel.", ctx.guild)] });
    }

    if (!isOwner) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Only the channel owner can manage this channel.", ctx.guild)] }, 5);
    }

    const vChannel = memberVoiceChannel as VoiceChannel;

    if (action === "lock") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { Connect: false });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { locked: true } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel locked. Only trusted users can connect.", ctx.guild)] });
    }

    if (action === "unlock") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { Connect: null });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { locked: false } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel unlocked for everyone.", ctx.guild)] });
    }

    if (action === "hide") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: false });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { hidden: true } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel is now hidden.", ctx.guild)] });
    }

    if (action === "unhide" || action === "uhide") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: null });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { hidden: false } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel is now visible.", ctx.guild)] });
    }

    if (action === "rename" || action === "name") {
      const newName = ctx.args.slice(1).join(" ");
      if (!newName) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a new name.", ctx.guild)] }, 5);
      await vChannel.setName(newName);
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { name: newName } });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Channel renamed to **${newName}**`, ctx.guild)] });
    }

    if (action === "limit") {
      const limit = ctx.getIntegerOption("limit", 1);
      if (limit === null || limit < 0 || limit > 99) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid limit (0-99).", ctx.guild)] }, 5);
      }
      await vChannel.setUserLimit(limit);
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { limit } });
      return ctx.reply({ embeds: [UniversalEmbed.success(`User limit set to **${limit}**`, ctx.guild)] });
    }

    if (action === "region") {
      const region = ctx.getStringOption("region", 1)?.toLowerCase();
      if (!region) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a region (automatic, us-east, us-west, Europe, India, Singapore).", ctx.guild)] }, 5);
      const rtcRegion = region === "automatic" ? null : region;
      await vChannel.setRTCRegion(rtcRegion);
      return ctx.reply({ embeds: [UniversalEmbed.success(`RTC region successfully set to **${region}**`, ctx.guild)] });
    }

    if (action === "block") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member to block.", ctx.guild)] }, 5);
      
      await vChannel.permissionOverwrites.edit(target.id, { Connect: false });
      
      // If currently connected to the voice channel, disconnect them
      if (target.voice.channelId === vChannel.id) {
        await target.voice.disconnect("Blocked by channel owner");
      }

      const untrustedList = [...(dbVc.untrusted ?? []), target.id];
      await prisma.tempVC.update({
        where: { channelId: vChannel.id },
        data: { untrusted: untrustedList }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Blocked **${target.user.tag}** from joining this channel.`, ctx.guild)] });
    }

    if (action === "trust") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to trust.", ctx.guild)] }, 5);
      await vChannel.permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });
      
      const trustedList = [...(dbVc.trusted ?? []), target.id];
      await prisma.tempVC.update({
        where: { channelId: vChannel.id },
        data: { trusted: trustedList }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Trusted **${target.user.tag}** for this channel.`, ctx.guild)] });
    }

    if (action === "untrust") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to untrust.", ctx.guild)] }, 5);
      await vChannel.permissionOverwrites.delete(target.id);
      
      const trustedList = (dbVc.trusted ?? []).filter(id => id !== target.id);
      await prisma.tempVC.update({
        where: { channelId: vChannel.id },
        data: { trusted: trustedList }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${target.user.tag}** from trusted list.`, ctx.guild)] });
    }

    if (action === "kick" || action === "remove") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to kick from VC.", ctx.guild)] }, 5);
      if (target.voice.channelId !== vChannel.id) {
        return ctx.reply({ embeds: [UniversalEmbed.error("This user is not in your channel.", ctx.guild)] }, 5);
      }
      await target.voice.disconnect("Kicked by channel owner");
      return ctx.reply({ embeds: [UniversalEmbed.success(`Kicked **${target.user.tag}** from channel.`, ctx.guild)] });
    }

    if (action === "transfer") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to transfer ownership to.", ctx.guild)] }, 5);
      
      // Delete old owner overrides
      try {
        await vChannel.permissionOverwrites.delete(ctx.user.id);
      } catch {}

      // Add new owner overrides
      await vChannel.permissionOverwrites.edit(target.id, {
        Connect: true,
        Speak: true,
        MuteMembers: true,
        DeafenMembers: true,
        MoveMembers: true
      });

      await prisma.tempVC.update({
        where: { channelId: vChannel.id },
        data: { ownerId: target.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Transferred ownership to **${target.user.tag}**.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.error("Invalid action. Type `-tempvc` to view all commands.", ctx.guild)] }, 5);
  }
};
