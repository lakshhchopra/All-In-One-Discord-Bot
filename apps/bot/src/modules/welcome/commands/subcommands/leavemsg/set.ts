import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeSet(ctx: CommandContext) {
  const msg = ctx.args.slice(1).join(" ");
  if (!msg) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a leave message template. Example: `Goodbye {user}!`", ctx.guild)] }, 5);
  }

  // Check if first argument is channel
  const channel = ctx.getChannelOption("value", 1);
  if (channel) {
    const textMsg = ctx.args.slice(2).join(" ");
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { leaveChannelId: channel.id, leaveMessage: textMsg || null },
      create: { guildId: ctx.guild.id, leaveChannelId: channel.id, leaveMessage: textMsg || null }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Leave channel set to ${channel} and message template updated.`, ctx.guild)] });
  }

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { leaveMessage: msg },
    create: { guildId: ctx.guild.id, leaveMessage: msg }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Leave message template set to: \`${msg}\``, ctx.guild)] });
}
