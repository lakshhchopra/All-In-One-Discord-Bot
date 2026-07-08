import { Command } from "../../../commands/command.js";
import { drawBoostCard } from "../../../services/canvas.js";
import { AttachmentBuilder } from "discord.js";

export const testBoostCommand: Command = {
  name: "testboost",
  description: "Test boost greetings canvas card rendering.",
  category: "Welcomer",
  permissionLevel: "ADMIN",
  usage: "testboost",
  examples: ["testboost"],
  execute: async (ctx) => {
    await ctx.reply("⏳ Rendering card, please wait...");
    const avatarUrl = ctx.user.displayAvatarURL({ extension: "png" });
    const buffer = await drawBoostCard(avatarUrl, ctx.user.username, ctx.guild.name);
    const attachment = new AttachmentBuilder(buffer, { name: "boost.png" });
    return ctx.reply({ content: `✅ Boost card preview:`, files: [attachment] });
  }
};
