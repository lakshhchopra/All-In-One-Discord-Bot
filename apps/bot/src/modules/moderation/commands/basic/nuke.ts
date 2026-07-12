import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { isWhitelisted } from "../../../../utils/security.js";
import { PermissionFlagsBits, TextChannel } from "discord.js";

export const nukeCommand: Command = {
  name: "nuke",
  description: "Clone and delete this channel, wiping all messages instantly.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "nuke [confirm]",
  examples: ["nuke confirm"],
  execute: async (ctx) => {
    const allowed = await isWhitelisted(ctx.guild, ctx.user.id, "nuke");
    if (!allowed) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You are not authorized to nuke channels.", ctx.guild)] }, 5);
    }

    const confirm = ctx.getStringOption("confirm", 0);
    if (confirm?.toLowerCase() !== "confirm") {
      return ctx.reply({
        embeds: [UniversalEmbed.error(
          "⚠️ This will **delete and recreate** this channel, wiping all messages.\nType `nuke confirm` to proceed.",
          ctx.guild
        )]
      }, 10);
    }

    const channel = ctx.channel as TextChannel;
    if (!channel.clone) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This channel cannot be nuked.", ctx.guild)] }, 5);
    }

    const cloned = await channel.clone({ reason: `Nuke by ${ctx.user.tag}` });
    await cloned.setPosition(channel.rawPosition);
    await channel.delete(`Nuke command by ${ctx.user.tag}`);

    await (cloned as TextChannel).send({
      embeds: [
        UniversalEmbed.success("💥 Channel has been nuked successfully.", ctx.guild)
          .setFooter({ text: `Nuked by ${ctx.user.tag}` })
      ]
    });
  }
};
