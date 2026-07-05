import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { VoiceChannel, ChannelType, PermissionFlagsBits } from "discord.js";

export const setupGeneratorCommand: Command = {
  name: "setupgenerator",
  description: "Sets up a voice generator channel for Temp VC.",
  category: "Temporary Voice",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0) as VoiceChannel;
    if (!channel || channel.type !== ChannelType.GuildVoice) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid Voice Channel.", ctx.guild)] }, 5);
    }

    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: {
        tempVcGeneratorId: channel.id,
        tempVcCategoryId: channel.parentId
      },
      create: {
        guildId: ctx.guild.id,
        tempVcGeneratorId: channel.id,
        tempVcCategoryId: channel.parentId
      }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Temp VC Generator channel set to **${channel.name}**`, ctx.guild)] });
  }
};

export const tempvcCommand: Command = {
  name: "tempvc",
  description: "Manage your temporary voice channel.",
  category: "Temporary Voice",
  execute: async (ctx) => {
    const sub = ctx.getStringOption("action", 0);

    // Get target channel where member is currently connected
    const memberVoiceChannel = ctx.member.voice.channel;
    if (!memberVoiceChannel) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not in a voice channel.", ctx.guild)] }, 5);
    }

    // Lookup temp vc in database
    const dbVc = await prisma.tempVC.findUnique({
      where: { channelId: memberVoiceChannel.id }
    });

    if (!dbVc && sub !== "claim") {
      return ctx.reply({ embeds: [UniversalEmbed.error("This is not a managed temporary voice channel.", ctx.guild)] }, 5);
    }

    const isOwner = dbVc?.ownerId === ctx.user.id;

    if (sub === "claim") {
      if (dbVc) {
        // If current owner is in the channel, cannot claim
        const ownerInChannel = memberVoiceChannel.members.has(dbVc.ownerId);
        if (ownerInChannel) {
          return ctx.reply({ embeds: [UniversalEmbed.error("The owner is currently in this channel.", ctx.guild)] }, 5);
        }

        await prisma.tempVC.update({
          where: { channelId: memberVoiceChannel.id },
          data: { ownerId: ctx.user.id }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success("You have claimed ownership of this channel.", ctx.guild)] });
      } else {
        return ctx.reply({ embeds: [UniversalEmbed.error("This channel cannot be claimed.", ctx.guild)] }, 5);
      }
    }

    if (!isOwner) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Only the channel owner can manage this channel.", ctx.guild)] }, 5);
    }

    const vChannel = memberVoiceChannel as VoiceChannel;

    if (sub === "lock") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { Connect: false });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { locked: true } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel locked. Only trusted users can connect.", ctx.guild)] });
    }

    if (sub === "unlock") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { Connect: null });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { locked: false } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel unlocked for everyone.", ctx.guild)] });
    }

    if (sub === "hide") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: false });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { hidden: true } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel is now hidden.", ctx.guild)] });
    }

    if (sub === "unhide") {
      await vChannel.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: null });
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { hidden: false } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Channel is now visible.", ctx.guild)] });
    }

    if (sub === "rename") {
      const newName = ctx.args.slice(1).join(" ");
      if (!newName) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a new name.", ctx.guild)] }, 5);
      await vChannel.setName(newName);
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { name: newName } });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Channel renamed to **${newName}**`, ctx.guild)] });
    }

    if (sub === "limit") {
      const limit = ctx.getIntegerOption("limit", 1);
      if (limit === null || limit < 0 || limit > 99) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid limit (0-99).", ctx.guild)] }, 5);
      }
      await vChannel.setUserLimit(limit);
      await prisma.tempVC.update({ where: { channelId: vChannel.id }, data: { limit } });
      return ctx.reply({ embeds: [UniversalEmbed.success(`User limit set to **${limit}**`, ctx.guild)] });
    }

    if (sub === "trust") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to trust.", ctx.guild)] }, 5);
      await vChannel.permissionOverwrites.edit(target.id, { Connect: true, ViewChannel: true });
      
      const trustedList = [...(dbVc?.trusted ?? []), target.id];
      await prisma.tempVC.update({
        where: { channelId: vChannel.id },
        data: { trusted: trustedList }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Trusted **${target.user.tag}** for this channel.`, ctx.guild)] });
    }

    if (sub === "untrust") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to untrust.", ctx.guild)] }, 5);
      await vChannel.permissionOverwrites.delete(target.id);
      
      const trustedList = (dbVc?.trusted ?? []).filter(id => id !== target.id);
      await prisma.tempVC.update({
        where: { channelId: vChannel.id },
        data: { trusted: trustedList }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${target.user.tag}** from trusted list.`, ctx.guild)] });
    }

    if (sub === "remove") {
      const target = ctx.getMemberOption("member", 1);
      if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to kick from VC.", ctx.guild)] }, 5);
      if (target.voice.channelId !== vChannel.id) {
        return ctx.reply({ embeds: [UniversalEmbed.error("This user is not in your channel.", ctx.guild)] }, 5);
      }
      await target.voice.disconnect("Kicked by channel owner");
      return ctx.reply({ embeds: [UniversalEmbed.success(`Kicked **${target.user.tag}** from channel.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `tempvc [lock|unlock|hide|unhide|rename|limit|trust|untrust|remove|claim] [value]`", ctx.guild)] });
  }
};

export function registerTempVc() {
  CommandRegistry.register(setupGeneratorCommand);
  CommandRegistry.register(tempvcCommand);
}
