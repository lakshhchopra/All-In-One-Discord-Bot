import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeReset(ctx: CommandContext) {
  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { autoRolesHumans: [], autoRolesBots: [] },
    create: { guildId: ctx.guild.id, autoRolesHumans: [], autoRolesBots: [] }
  });
  return ctx.reply({ embeds: [UniversalEmbed.success("All auto roles reset.", ctx.guild)] });
}
