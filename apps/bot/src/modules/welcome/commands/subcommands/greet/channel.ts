import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeChannel(ctx: CommandContext, isReset: boolean) {
  if (isReset) {
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { welcomeChannelId: null },
      create: { guildId: ctx.guild.id, welcomeChannelId: null }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("Welcome channel has been reset.", ctx.guild)] });
  }

  const channel = ctx.getChannelOption("channel", 1) || ctx.getChannelOption("channel", 2);
  if (!channel) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a welcome channel.", ctx.guild)] }, 5);
  }

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { welcomeChannelId: channel.id },
    create: { guildId: ctx.guild.id, welcomeChannelId: channel.id }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome channel set to ${channel}`, ctx.guild)] });
}
