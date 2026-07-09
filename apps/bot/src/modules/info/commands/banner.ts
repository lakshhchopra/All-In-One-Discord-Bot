import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const bannerCommand: Command = {
  name: "banner",
  description: "View the banner image of a member.",
  category: "General Commands",
  usage: "banner [member]",
  examples: ["banner", "banner @member"],
  execute: async (ctx) => {
    const targetMember = ctx.getMemberOption("member", 0) || ctx.member;

    // Fetch user to get banner data
    const user = await ctx.guild.client.users.fetch(targetMember.id, { force: true });
    const bannerUrl = user.bannerURL({ size: 1024 });

    if (!bannerUrl) {
      return ctx.reply({ embeds: [UniversalEmbed.info(`**${user.tag}** does not have a profile banner set.`, ctx.guild)] });
    }

    const embed = UniversalEmbed.neutral(`Banner of ${user.tag}`, ctx.guild)
      .setImage(bannerUrl);

    return ctx.reply({ embeds: [embed] });
  }
};
