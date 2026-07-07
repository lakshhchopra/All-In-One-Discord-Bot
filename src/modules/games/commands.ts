import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";

export const setCountChannelCommand: Command = {
  name: "setcountchannel",
  description: "Sets the counting game channel.",
  category: "Games",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0);
    if (!channel) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a channel.", ctx.guild)] }, 5);

    await prisma.countState.upsert({
      where: { guildId: ctx.guild.id },
      update: { channelId: channel.id, currentCount: 0, lastUserId: null },
      create: { guildId: ctx.guild.id, channelId: channel.id, currentCount: 0 }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Counting channel configured to ${channel}. Reset count to \`0\`.`, ctx.guild)] });
  }
};

export const lbCountCommand: Command = {
  name: "lbcount",
  aliases: ["countinglb"],
  description: "Display counting game high scores.",
  category: "Games",
  execute: async (ctx) => {
    const state = await prisma.countState.findUnique({ where: { guildId: ctx.guild.id } });
    if (!state) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Counting game has not been configured in this server.", ctx.guild)] }, 5);
    }

    const embed = UniversalEmbed.info("Counting Game Status", ctx.guild)
      .addFields(
        { name: "Current Count", value: `\`${state.currentCount}\``, inline: true },
        { name: "High Score", value: `\`${state.highScore}\``, inline: true }
      );
    return ctx.reply({ embeds: [embed] });
  }
};

export const shipCommand: Command = {
  name: "ship",
  description: "Calculate matching compatibility percentage between two users.",
  category: "Games",
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

export function registerGames() {
  CommandRegistry.register(setCountChannelCommand);
  CommandRegistry.register(lbCountCommand);
  CommandRegistry.register(shipCommand);
}
