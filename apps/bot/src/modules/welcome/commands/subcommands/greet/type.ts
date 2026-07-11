import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeType(ctx: CommandContext) {
  const type = ctx.getStringOption("value", 1)?.toLowerCase();
  if (!type || !["normal", "embed", "both"].includes(type)) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid welcome message type: `normal`, `embed`, or `both`.", ctx.guild)] }, 5);
  }

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { welcomeType: type } as any,
    create: { guildId: ctx.guild.id, welcomeType: type } as any
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome message type set to: **${type}**`, ctx.guild)] });
}
