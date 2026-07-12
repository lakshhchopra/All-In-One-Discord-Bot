import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { isWhitelisted } from "../../../../utils/security.js";
import { TextChannel, ChannelType } from "discord.js";

export const cloneCommand: Command = {
  name: "clone",
  description: "Clone a channel, duplicating its settings and permissions.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "clone [#channel]",
  examples: ["clone", "clone #general"],
  execute: async (ctx) => {
    const allowed = await isWhitelisted(ctx.guild, ctx.user.id, "channel");
    if (!allowed) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not authorized to clone channels.", ctx.guild)] }, 5);
    }

    const targetCh = ctx.getChannelOption("channel", 0) || ctx.channel;
    const channel = ctx.guild.channels.cache.get((targetCh as any).id);
    if (!channel || !("clone" in channel)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Cannot clone this channel type.", ctx.guild)] }, 5);
    }

    const cloned = await (channel as TextChannel).clone({ reason: `Clone by ${ctx.user.tag}` });

    return ctx.reply({
      embeds: [
        UniversalEmbed.success(`📋 Cloned **${channel.name}** → ${cloned}`, ctx.guild)
      ]
    });
  }
};
