import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeDisable(ctx: CommandContext) {
  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { welcomeDmEnabled: false },
    create: { guildId: ctx.guild.id, welcomeDmEnabled: false }
  });
  return ctx.reply({ embeds: [UniversalEmbed.success("Welcome greetings **disabled**.", ctx.guild)] });
}
