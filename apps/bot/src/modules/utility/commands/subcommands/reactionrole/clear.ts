import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeClear(ctx: CommandContext) {
  await prisma.reactionRole.deleteMany({ where: { guildId: ctx.guild.id } });
  return ctx.reply({ embeds: [UniversalEmbed.success("All reaction role configurations cleared.", ctx.guild)] });
}
