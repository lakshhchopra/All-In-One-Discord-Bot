import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeDisable(ctx: CommandContext) {
  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { boostChannelId: null },
    create: { guildId: ctx.guild.id, boostChannelId: null }
  });
  return ctx.reply({ embeds: [UniversalEmbed.success("Boost greetings **disabled**.", ctx.guild)] });
}
