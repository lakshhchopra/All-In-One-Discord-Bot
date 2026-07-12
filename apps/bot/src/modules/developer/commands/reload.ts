import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { isDeveloper } from "../../../utils/security.js";

export const reloadCommand: Command = {
  name: "reload",
  aliases: ["re", "restart"],
  description: "Restart the bot process.",
  category: "Developer",
  usage: "reload",
  execute: async (ctx: any) => {
    const isDev = await isDeveloper(ctx.user.id);
    if (!isDev) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This command is restricted to Bot Developers.", ctx.guild)] }, 5);
    }

    await ctx.reply({ 
      embeds: [UniversalEmbed.success("🔄 Restarting the bot...", ctx.guild)] 
    });

    // Exit gracefully to allow PM2/Docker to auto-restart
    process.exit(0);
  }
};

