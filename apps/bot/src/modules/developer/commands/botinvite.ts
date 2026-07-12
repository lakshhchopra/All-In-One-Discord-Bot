import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { OAuth2Scopes, PermissionFlagsBits } from "discord.js";

export const botInviteCommand: Command = {
  name: "botinvite",
  aliases: ["invitebot", "invite"],
  description: "Get the invite link to add this bot to your server.",
  category: "Developer",
  usage: "botinvite",
  execute: async (ctx: any) => {
    const inviteUrl = ctx.client.generateInvite({
      permissions: [PermissionFlagsBits.Administrator],
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
    });

    const embed = new UniversalEmbed("info")
      .setTitle("Invite Me!")
      .setDescription(`Want to add **${ctx.client.user?.username}** to another server?\n\n[**Click here to invite me!**](${inviteUrl})`)
      .setThumbnail(ctx.client.user?.displayAvatarURL() || null);

    return ctx.reply({ embeds: [embed] });
  }
};

