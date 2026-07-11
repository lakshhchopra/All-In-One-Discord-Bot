import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeReset(ctx: CommandContext) {
  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { boostChannelId: null, boostMessage: null },
    create: { guildId: ctx.guild.id, boostChannelId: null, boostMessage: null }
  });
  return ctx.reply({ embeds: [UniversalEmbed.success("Boost greeting configuration reset.", ctx.guild)] });
}
