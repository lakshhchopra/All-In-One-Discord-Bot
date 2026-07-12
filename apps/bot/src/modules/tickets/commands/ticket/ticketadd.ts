import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { TextChannel, ApplicationCommandOptionType } from "discord.js";

export const ticketaddCommand: Command = {
  name: "ticketadd",
  aliases: ["ticket add"],
  description: "Add a member to the current ticket.",
  category: "Ticket",
  permissionLevel: "MODERATOR",
  usage: "ticket add <@member>",
  execute: async (ctx: any) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member to add to this ticket.", ctx.guild)] }, 5);
    }

    const textCh = ctx.channel as TextChannel;
    if (!textCh.name.startsWith("ticket-")) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This channel is not a support ticket.", ctx.guild)] }, 5);
    }

    await textCh.permissionOverwrites.edit(member.id, {
      ViewChannel: true,
      SendMessages: true,
      ReadMessageHistory: true
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${member.user.tag}** to this ticket.`, ctx.guild)] });
  }
};

