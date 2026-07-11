import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeAdd(ctx: CommandContext) {
  const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
  const response = ctx.args.slice(2).join(" ");

  if (!trigger || !response) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder add <trigger> <response>`", ctx.guild)] }, 5);
  }

  await prisma.autoResponder.upsert({
    where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
    update: { response },
    create: { guildId: ctx.guild.id, trigger, response }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder added for trigger **${trigger}**.`, ctx.guild)] });
}
