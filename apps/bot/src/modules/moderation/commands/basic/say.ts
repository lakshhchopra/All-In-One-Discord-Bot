import { Command } from "../../../../commands/command.js";
import { TextChannel, PermissionFlagsBits } from "discord.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const sayCommand: Command = {
  name: "say",
  description: "Send a message as the bot.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "say [channel] <message>",
  examples: ["say #announcements Hello everyone!", "say Hello!"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Messages`", ctx.guild)] }, 5);
    }

    const channel = ctx.getChannelOption("channel", 0) as TextChannel || ctx.channel;
    const msg = ctx.args.slice(channel.id === ctx.channel.id ? 0 : 1).join(" ");
    if (!msg) return ctx.wrongUsage(sayCommand);

    await channel.send(msg);
    return ctx.reply({ embeds: [UniversalEmbed.success("Message sent successfully.", ctx.guild)] }, 3);
  }
};
