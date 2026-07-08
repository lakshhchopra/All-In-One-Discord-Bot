import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const shipCommand: Command = {
  name: "ship",
  description: "Calculate matching compatibility percentage between two users.",
  category: "Games",
  usage: "ship <user1> <user2>",
  examples: ["ship @member1 @member2"],
  execute: async (ctx) => {
    const user1 = ctx.getMemberOption("user1", 0) || ctx.member;
    const user2 = ctx.getMemberOption("user2", 1);

    if (!user2) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `ship <user1> <user2>`", ctx.guild)] }, 5);
    }

    const percent = Math.floor(Math.random() * 101);
    let bar = "";
    const progress = Math.round(percent / 10);
    for (let i = 0; i < 10; i++) {
      bar += i < progress ? "❤️" : "🖤";
    }

    const embed = UniversalEmbed.neutral("Ship Match Calculator", ctx.guild)
      .setDescription(
        `**Match:** ${user1} + ${user2}\n` +
        `**Percentage:** **${percent}%**\n` +
        `${bar}`
      );
    return ctx.reply({ embeds: [embed] });
  }
};
