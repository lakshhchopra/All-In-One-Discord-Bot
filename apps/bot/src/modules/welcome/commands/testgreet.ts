import { Command } from "../../../commands/command.js";
import { drawWelcomeCard } from "../../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";

export const testGreetCommand: Command = {
  name: "testgreet",
  description: "Test welcome greetings canvas card rendering.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  usage: "testgreet",
  examples: ["testgreet"],
  execute: async (ctx) => {
    await ctx.reply("⏳ Rendering card, please wait...");
    const avatarUrl = ctx.user.displayAvatarURL({ extension: "png" });
    const buffer = await drawWelcomeCard(avatarUrl, ctx.user.username, ctx.guild.name, String(ctx.guild.memberCount));
    const attachment = new AttachmentBuilder(buffer, { name: "welcome.png" });
    return ctx.reply({ content: `✅ Welcome card preview:`, files: [attachment] });
  }
};
