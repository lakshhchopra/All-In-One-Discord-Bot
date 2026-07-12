import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const servericonCommand: Command = {
  name: "servericon",
  aliases: ["icon"],
  description: "Get the server icon image URL.",
  category: "General Commands",
  usage: "servericon",
  examples: ["servericon"],
  execute: async (ctx: any) => {
    const iconUrl = ctx.guild.iconURL({ size: 1024 });

    if (!iconUrl) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This server does not have an icon set.", ctx.guild)] }, 5);
    }

    const embed = UniversalEmbed.neutral(`${ctx.guild.name} Server Icon`, ctx.guild)
      .setImage(iconUrl);

    return ctx.reply({ embeds: [embed] });
  }
};

