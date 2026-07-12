import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeSet(ctx: CommandContext) {
  const msg = ctx.args.slice(1).join(" ");
  if (!msg) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a boost message template.", ctx.guild)] }, 5);
  }

  const channel = ctx.getChannelOption("value", 1);
  if (channel) {
    const textMsg = ctx.args.slice(2).join(" ");
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { boostChannelId: channel.id, boostMessage: textMsg || null },
      create: { guildId: ctx.guild.id, boostChannelId: channel.id, boostMessage: textMsg || null }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Boost channel set to ${channel} and message template updated.`, ctx.guild)] });
  }

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { boostMessage: msg },
    create: { guildId: ctx.guild.id, boostMessage: msg }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Boost message template set to: \`${msg}\``, ctx.guild)] });
}
