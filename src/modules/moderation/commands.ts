import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { PermissionFlagsBits, TextChannel, VoiceChannel } from "discord.js";

export const sayCommand: Command = {
  name: "say",
  description: "Send a message as the bot.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0) as TextChannel || ctx.channel;
    const msg = ctx.args.slice(channel ? 1 : 0).join(" ");
    if (!msg) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a message to send.", ctx.guild)] }, 5);
    await channel.send(msg);
    return ctx.reply({ embeds: [UniversalEmbed.success("Message sent successfully.", ctx.guild)] }, 3);
  }
};

export const purgeCommand: Command = {
  name: "purge",
  description: "Purge messages from a channel (optional user or bot filter).",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const filter = ctx.getStringOption("filter", 0); // bots, user, amount
    let amount = ctx.getIntegerOption("amount", 1) ?? parseInt(ctx.args[0], 10);
    const targetUser = ctx.getMemberOption("user", 1);

    if (isNaN(amount)) {
      amount = parseInt(filter, 10);
    }

    if (isNaN(amount) || amount < 1 || amount > 100) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid amount of messages (1-100) to purge.", ctx.guild)] }, 5);
    }

    let messages = await ctx.channel.messages.fetch({ limit: amount });

    if (filter === "bots") {
      messages = messages.filter(m => m.author.bot);
    } else if (filter === "user" && targetUser) {
      messages = messages.filter(m => m.author.id === targetUser.id);
    }

    if (ctx.channel.isTextBased() && "bulkDelete" in ctx.channel) {
      await ctx.channel.bulkDelete(messages, true);
    }

    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully cleared **${messages.size}** message(s).`, ctx.guild)] }, 5);
  }
};

export const banCommand: Command = {
  name: "ban",
  description: "Ban a member from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to ban.", ctx.guild)] }, 5);
    const reason = ctx.args.slice(1).join(" ") || "No reason specified";

    if (!target.bannable) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This user cannot be banned (hierarchy or permissions missing).", ctx.guild)] }, 5);
    }

    await target.ban({ reason });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Banned **${target.user.tag}** | Reason: ${reason}`, ctx.guild)] });
  }
};

export const unbanCommand: Command = {
  name: "unban",
  description: "Unban a user from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const id = ctx.getStringOption("userId", 0);
    if (!id) return ctx.reply({ embeds: [UniversalEmbed.error("Please provide the user ID to unban.", ctx.guild)] }, 5);

    try {
      const user = await ctx.guild.members.unban(id);
      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully unbanned **${user.tag}**`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Failed to unban user. Check if ID is correct or user is not banned.", ctx.guild)] }, 5);
    }
  }
};

export const kickCommand: Command = {
  name: "kick",
  description: "Kick a member from the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to kick.", ctx.guild)] }, 5);
    const reason = ctx.args.slice(1).join(" ") || "No reason specified";

    if (!target.kickable) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This user cannot be kicked.", ctx.guild)] }, 5);
    }

    await target.kick(reason);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Kicked **${target.user.tag}** | Reason: ${reason}`, ctx.guild)] });
  }
};

export const muteCommand: Command = {
  name: "mute",
  description: "Voice mute a member in voice channels.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setMute(true);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Voice muted **${member.user.tag}**`, ctx.guild)] });
  }
};

export const unmuteCommand: Command = {
  name: "unmute",
  description: "Voice unmute a member in voice channels.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);
    if (!member.voice.channel) return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in a voice channel.", ctx.guild)] }, 5);

    await member.voice.setMute(false);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Voice unmuted **${member.user.tag}**`, ctx.guild)] });
  }
};

export const timeoutCommand: Command = {
  name: "timeout",
  description: "Timeout a member.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    const duration = ctx.getIntegerOption("duration", 1); // in minutes
    if (!target || !duration) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `timeout <member> <duration_minutes> [reason]`", ctx.guild)] }, 5);
    const reason = ctx.args.slice(2).join(" ") || "No reason specified";

    await target.timeout(duration * 60 * 1000, reason);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Timed out **${target.user.tag}** for **${duration}** minute(s). Reason: ${reason}`, ctx.guild)] });
  }
};

export const lockCommand: Command = {
  name: "lock",
  description: "Lock the current channel or all channels.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const target = ctx.getStringOption("target", 0); // all, or none

    if (target === "all") {
      const textChannels = ctx.guild.channels.cache.filter(c => c.isTextBased() && !c.isDMBased());
      for (const [_, ch] of textChannels) {
        try {
          if (ch instanceof TextChannel) {
            await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
          }
        } catch {}
      }
      return ctx.reply({ embeds: [UniversalEmbed.success("Locked all text channels in this server.", ctx.guild)] });
    }

    const channel = ctx.channel as TextChannel;
    await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: false });
    return ctx.reply({ embeds: [UniversalEmbed.success("Locked this channel.", ctx.guild)] });
  }
};

export const unlockCommand: Command = {
  name: "unlock",
  description: "Unlock the current channel or all channels.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const target = ctx.getStringOption("target", 0);

    if (target === "all") {
      const textChannels = ctx.guild.channels.cache.filter(c => c.isTextBased() && !c.isDMBased());
      for (const [_, ch] of textChannels) {
        try {
          if (ch instanceof TextChannel) {
            await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: null });
          }
        } catch {}
      }
      return ctx.reply({ embeds: [UniversalEmbed.success("Unlocked all text channels in this server.", ctx.guild)] });
    }

    const channel = ctx.channel as TextChannel;
    await channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { SendMessages: null });
    return ctx.reply({ embeds: [UniversalEmbed.success("Unlocked this channel.", ctx.guild)] });
  }
};

export const nicknameCommand: Command = {
  name: "nickname",
  description: "Change the nickname of a member.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const member = ctx.getMemberOption("member", 0);
    const nick = ctx.args.slice(1).join(" ");
    if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member.", ctx.guild)] }, 5);

    await member.setNickname(nick || null);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Nickname updated for **${member.user.tag}**`, ctx.guild)] });
  }
};

export const roleCommand: Command = {
  name: "role",
  description: "Manage roles for users.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // add, remove
    const member = ctx.getMemberOption("member", 1);
    const role = ctx.getRoleOption("role", 2);

    if (!member || !role) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `role [add|remove] <member> <role>`", ctx.guild)] }, 5);
    }

    if (action === "add") {
      if (member.roles.cache.has(role.id)) {
        return ctx.reply({ embeds: [UniversalEmbed.warning("This member already has that role.", ctx.guild)] }, 5);
      }
      await member.roles.add(role.id);
      return ctx.reply({ embeds: [UniversalEmbed.success(`Added role **${role.name}** to **${member.user.tag}**`, ctx.guild)] });
    }

    if (action === "remove") {
      if (!member.roles.cache.has(role.id)) {
        return ctx.reply({ embeds: [UniversalEmbed.warning("This member does not have that role.", ctx.guild)] }, 5);
      }
      await member.roles.remove(role.id);
      return ctx.reply({ embeds: [UniversalEmbed.success(`Removed role **${role.name}** from **${member.user.tag}**`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `role [add|remove] <member> <role>`", ctx.guild)] });
  }
};

export const emojiCommand: Command = {
  name: "emoji",
  description: "Steal emojis and add them to this server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const sub = ctx.getStringOption("sub", 0); // steal, stealbulk

    if (sub === "steal") {
      const url = ctx.getStringOption("url", 1);
      const name = ctx.getStringOption("name", 2);
      if (!url || !name) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `emoji steal <url> <name>`", ctx.guild)] }, 5);

      try {
        const emoji = await ctx.guild.emojis.create({ attachment: url, name });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully added emoji ${emoji}`, ctx.guild)] });
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to steal emoji. Check size or URL format.", ctx.guild)] }, 5);
      }
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `emoji steal <url> <name>`", ctx.guild)] });
  }
};

export const slowmodeCommand: Command = {
  name: "slowmode",
  description: "Configure slowmode duration for this channel.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const seconds = ctx.getIntegerOption("seconds", 0);
    if (seconds === null) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a duration in seconds (or 0 to disable).", ctx.guild)] }, 5);

    const channel = ctx.channel as TextChannel;
    await channel.setRateLimitPerUser(seconds);
    return ctx.reply({ embeds: [UniversalEmbed.success(`Slowmode has been set to **${seconds}** seconds.`, ctx.guild)] });
  }
};

export function registerModeration() {
  CommandRegistry.register(sayCommand);
  CommandRegistry.register(purgeCommand);
  CommandRegistry.register(banCommand);
  CommandRegistry.register(unbanCommand);
  CommandRegistry.register(kickCommand);
  CommandRegistry.register(muteCommand);
  CommandRegistry.register(unmuteCommand);
  CommandRegistry.register(timeoutCommand);
  CommandRegistry.register(lockCommand);
  CommandRegistry.register(unlockCommand);
  CommandRegistry.register(nicknameCommand);
  CommandRegistry.register(roleCommand);
  CommandRegistry.register(emojiCommand);
  CommandRegistry.register(slowmodeCommand);
}
