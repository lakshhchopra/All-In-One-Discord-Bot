import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { TextChannel , PermissionFlagsBits } from "discord.js";

export const hideallCommand: Command = {
  name: "hideall",
  description: "Hide all text channels in the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "hideall",
  examples: ["hideall"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Channels`", ctx.guild)] }, 5);
    }

    const channels = ctx.guild.channels.cache.filter(c => c.isTextBased() && !c.isDMBased());
    for (const [_, ch] of channels) {
      try {
        if (ch instanceof TextChannel) {
          await ch.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: false });
        }
      } catch {}
    }
    return ctx.reply({ embeds: [UniversalEmbed.success("Successfully hid all text channels in this server.", ctx.guild)] }, 5);
  }
};
