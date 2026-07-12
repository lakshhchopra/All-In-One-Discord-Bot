import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeReset(ctx: CommandContext) {
  await prisma.autoResponder.deleteMany({ where: { guildId: ctx.guild.id } });
  return ctx.reply({ embeds: [UniversalEmbed.success("All auto responders have been cleared.", ctx.guild)] });
}
