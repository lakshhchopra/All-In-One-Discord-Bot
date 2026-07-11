import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeAdd(ctx: CommandContext) {
  const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
  const emojis = ctx.args.slice(2);

  if (!trigger || emojis.length === 0) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoreact add <trigger> <emojis...>`", ctx.guild)] }, 5);
  }

  await prisma.autoReact.upsert({
    where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
    update: { emojis },
    create: { guildId: ctx.guild.id, trigger, emojis }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Auto reactions set for **${trigger}**: ${emojis.join(" ")}`, ctx.guild)] });
}
