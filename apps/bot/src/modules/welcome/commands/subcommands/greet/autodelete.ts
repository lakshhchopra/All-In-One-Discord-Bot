import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../../../utils/duration.js";

export async function executeAutodelete(ctx: CommandContext) {
  const raw = ctx.getStringOption("value", 1);
  if (!raw) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a duration (e.g. `10s`, `1m`).", ctx.guild)] }, 5);

  const parsed = parseDuration(raw);
  if (!parsed) return ctx.reply({ embeds: [UniversalEmbed.error(DURATION_FORMAT_ERROR, ctx.guild)] }, 5);

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { welcomeAutoDelete: parsed.seconds },
    create: { guildId: ctx.guild.id, welcomeAutoDelete: parsed.seconds }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome messages will autodelete after **${parsed.label}**.`, ctx.guild)] });
}
