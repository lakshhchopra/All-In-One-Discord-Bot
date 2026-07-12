import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeDisable(ctx: CommandContext) {
  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { leaveChannelId: null },
    create: { guildId: ctx.guild.id, leaveChannelId: null }
  });
  return ctx.reply({ embeds: [UniversalEmbed.success("Leave messages **disabled**.", ctx.guild)] });
}
