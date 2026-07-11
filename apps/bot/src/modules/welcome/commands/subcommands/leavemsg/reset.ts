import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeReset(ctx: CommandContext) {
  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { leaveChannelId: null, leaveMessage: null },
    create: { guildId: ctx.guild.id, leaveChannelId: null, leaveMessage: null }
  });
  return ctx.reply({ embeds: [UniversalEmbed.success("Leave message configuration reset.", ctx.guild)] });
}
