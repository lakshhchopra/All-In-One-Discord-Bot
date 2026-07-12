import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeReset(ctx: CommandContext) {
  await prisma.autoReact.deleteMany({ where: { guildId: ctx.guild.id } });
  return ctx.reply({ embeds: [UniversalEmbed.success("All auto reaction triggers cleared.", ctx.guild)] });
}
