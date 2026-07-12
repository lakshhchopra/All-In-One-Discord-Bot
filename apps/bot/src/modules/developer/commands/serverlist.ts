import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { isDeveloper } from "../../../utils/security.js";

export const serverListCommand: Command = {
  name: "serverlist",
  aliases: ["servers", "guilds"],
  description: "List all the servers the bot is currently in.",
  category: "Developer",
  usage: "serverlist",
  execute: async (ctx: any) => {
    const isDev = await isDeveloper(ctx.user.id);
    if (!isDev) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This command is restricted to Bot Developers.", ctx.guild)] }, 5);
    }

    const guilds = Array.from(ctx.client.guilds.cache.values());
    guilds.sort((a, b) => b.memberCount - a.memberCount); // Sort by largest first

    const embed = new UniversalEmbed("info")
      .setTitle(`Server List (${guilds.length} total)`)
      .setDescription(
        guilds.slice(0, 20).map((g, i) => `**${i + 1}.** ${g.name} - \`${g.memberCount} members\` (${g.id})`).join("\n")
      );

    if (guilds.length > 20) {
      embed.setFooter({ text: `And ${guilds.length - 20} more servers...` });
    }

    return ctx.reply({ embeds: [embed] });
  }
};

