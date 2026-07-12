import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const countingCommand: Command = {
  name: "counting",
  description: "Configure counting minigame settings.",
  category: "Mini Games",
  permissionLevel: "ADMIN",
  usage: "counting <channel | show | reset> [#channel]",
  examples: [
    "counting channel #counting",
    "counting show",
    "counting reset"
  ],
  execute: async (ctx: any) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "channel") {
      const channel = ctx.getChannelOption("channel", 1);
      if (!channel) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a channel.", ctx.guild)] }, 5);
      }

      await prisma.countState.upsert({
        where: { guildId: ctx.guild.id },
        update: { channelId: channel.id, currentCount: 0, lastUserId: null },
        create: { guildId: ctx.guild.id, channelId: channel.id, currentCount: 0, lastUserId: null }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Counting channel set to ${channel}. Minigame is active!`, ctx.guild)] });
    }

    if (action === "show" || !action) {
      const state = await prisma.countState.findUnique({
        where: { guildId: ctx.guild.id }
      });

      if (!state) {
        return ctx.reply({ embeds: [UniversalEmbed.info("No counting minigame is currently configured.", ctx.guild)] });
      }

      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Counting Game Status", ctx.guild)
            .setDescription(
              `- **Active Channel:** <#${state.channelId}>\n` +
              `- **Current Count:** \`${state.currentCount}\`\n` +
              `- **High Score:** \`${state.highScore}\`\n` +
              `- **Last User:** ${state.lastUserId ? `<@${state.lastUserId}>` : "None"}`
            )
        ]
      });
    }

    if (action === "reset") {
      await prisma.countState.delete({
        where: { guildId: ctx.guild.id }
      }).catch(() => null);

      return ctx.reply({ embeds: [UniversalEmbed.success("Counting game configuration and stats cleared.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `counting [channel|show|reset] ...`", ctx.guild)] });
  }
};

