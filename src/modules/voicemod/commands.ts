import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { VoiceChannel } from "discord.js";

export const vcmuteCommand: Command = {
  name: "vcmute",
  description: "Mutes a user in a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setMute(true);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Voice muted **${member.user.tag}**`, ctx.guild)] });
  }
};

export const vcunmuteCommand: Command = {
  name: "vcunmute",
  description: "Unmutes a user in a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setMute(false);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Voice unmuted **${member.user.tag}**`, ctx.guild)] });
  }
};

export const vckickCommand: Command = {
  name: "vckick",
  description: "Kicks a user out of a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.disconnect("Voice kicked by moderator");
    return ctx.reply({ embeds: [UniversalEmbed.success(`Disconnected **${member.user.tag}** from voice channel.`, ctx.guild)] });
  }
};

export const vcdeafenCommand: Command = {
  name: "vcdeafen",
  description: "Deafens a user in a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setDeaf(true);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Deafened **${member.user.tag}**`, ctx.guild)] });
  }
};

export const vcundeafenCommand: Command = {
  name: "vcundeafen",
  description: "Undeafens a user in a voice channel.",
  category: "Voice Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setDeaf(false);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Undeafened **${member.user.tag}**`, ctx.guild)] });
  }
};

export const vclistCommand: Command = {
  name: "vclist",
  description: "List all users in your voice channel or a specified channel.",
  category: "Voice Moderation",
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0) as VoiceChannel || ctx.member.voice.channel;
    if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a voice channel or join one.", ctx.guild)] }, 5);

    const members = channel.members.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No members in this channel.";
    const embed = UniversalEmbed.info(`Users in voice channel **${channel.name}**`, ctx.guild)
      .setDescription(members);

    return ctx.reply({ embeds: [embed] });
  }
};

export const vcroleCommand: Command = {
  name: "vcrole",
  description: "Configure voice auto roles assigned to users in VC.",
  category: "Voice Moderation",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // humans, bots, show, reset

    // We store vcRoles configuration inside GuildConfig settings json column
    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
    const settings = (config?.logToggles as Record<string, any>) ?? {};
    let vcHumans = settings.vcRolesHumans ?? [];
    let vcBots = settings.vcRolesBots ?? [];

    if (action === "humans") {
      const sub = ctx.getStringOption("sub", 1); // add, remove
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      if (sub === "add") {
        if (!vcHumans.includes(role.id)) vcHumans.push(role.id);
      } else if (sub === "remove") {
        vcHumans = vcHumans.filter((id: string) => id !== role.id);
      }
      settings.vcRolesHumans = vcHumans;

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles: settings },
        create: { guildId: ctx.guild.id, logToggles: settings }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice auto-roles for humans updated.`, ctx.guild)] });
    }

    if (action === "bots") {
      const sub = ctx.getStringOption("sub", 1);
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      if (sub === "add") {
        if (!vcBots.includes(role.id)) vcBots.push(role.id);
      } else if (sub === "remove") {
        vcBots = vcBots.filter((id: string) => id !== role.id);
      }
      settings.vcRolesBots = vcBots;

      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { logToggles: settings },
        create: { guildId: ctx.guild.id, logToggles: settings }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice auto-roles for bots updated.`, ctx.guild)] });
    }

    if (action === "show") {
      const humansList = vcHumans.map((id: string) => `<@&${id}>`).join(", ") || "None";
      const botsList = vcBots.map((id: string) => `<@&${id}>`).join(", ") || "None";

      const embed = UniversalEmbed.info("Voice Auto Roles Settings", ctx.guild)
        .addFields(
          { name: "Humans VC Roles", value: humansList },
          { name: "Bots VC Roles", value: botsList }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      settings.vcRolesHumans = [];
      settings.vcRolesBots = [];
      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { logToggles: settings }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice auto-roles has been reset.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `vcrole [humans|bots|show|reset] [add|remove] [role]`", ctx.guild)] });
  }
};

export function registerVoiceMod() {
  CommandRegistry.register(vcmuteCommand);
  CommandRegistry.register(vcunmuteCommand);
  CommandRegistry.register(vckickCommand);
  CommandRegistry.register(vcdeafenCommand);
  CommandRegistry.register(vcundeafenCommand);
  CommandRegistry.register(vclistCommand);
  CommandRegistry.register(vcroleCommand);
}
