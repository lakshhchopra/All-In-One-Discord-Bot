import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const serverbannerCommand: Command = {
  name: "serverbanner",
  description: "Get the server banner image URL.",
  category: "General Commands",
  usage: "serverbanner",
  examples: ["serverbanner"],
  execute: async (ctx: any) => {
    const bannerUrl = ctx.guild.bannerURL({ size: 1024 });

    if (!bannerUrl) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This server does not have a banner set.", ctx.guild)] }, 5);
    }

    const embed = UniversalEmbed.neutral(`${ctx.guild.name} Server Banner`, ctx.guild)
      .setImage(bannerUrl);

    return ctx.reply({ embeds: [embed] });
  }
};

