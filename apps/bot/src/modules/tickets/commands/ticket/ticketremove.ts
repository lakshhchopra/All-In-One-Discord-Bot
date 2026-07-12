import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { TextChannel, ApplicationCommandOptionType } from "discord.js";

export const ticketremoveCommand: Command = {
  name: "ticketremove",
  aliases: ["ticket remove", "ticket delete"],
  description: "Remove a member from the current ticket.",
  category: "Ticket",
  permissionLevel: "MODERATOR",
  usage: "ticket remove <@member>",
  execute: async (ctx: any) => {
    const member = ctx.getMemberOption("member", 0);
    if (!member) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a member to remove from this ticket.", ctx.guild)] }, 5);
    }

    const textCh = ctx.channel as TextChannel;
    if (!textCh.name.startsWith("ticket-")) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This channel is not a support ticket.", ctx.guild)] }, 5);
    }

    await textCh.permissionOverwrites.delete(member.id);

    return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${member.user.tag}** from this ticket.`, ctx.guild)] });
  }
};

