import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const serverinfoCommand: Command = {
  name: "serverinfo",
  description: "Get detailed information about the server.",
  category: "Information",
  aliases: ["si"],
  usage: "serverinfo",
  examples: ["serverinfo"],
  execute: async (ctx: any) => {
    const guild = ctx.guild;

    const embed = UniversalEmbed.info(guild.name, guild)
      .setThumbnail(guild.iconURL())
      .addFields(
        { name: "Owner", value: `<@${guild.ownerId}>`, inline: true },
        { name: "Server ID", value: `\`${guild.id}\``, inline: true },
        { name: "Created At", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
        { name: "Members", value: `Total: \`${guild.memberCount}\``, inline: true },
        { name: "Boosts", value: `\`${guild.premiumSubscriptionCount ?? 0}\` (Tier ${guild.premiumTier})`, inline: true }
      );

    return ctx.reply({ embeds: [embed] });
  }
};

