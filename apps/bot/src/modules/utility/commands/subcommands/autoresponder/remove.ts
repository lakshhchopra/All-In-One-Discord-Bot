import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeRemove(ctx: CommandContext) {
  const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
  if (!trigger) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder remove <trigger>`", ctx.guild)] }, 5);
  }

  try {
    await prisma.autoResponder.delete({
      where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder for trigger **${trigger}** removed.`, ctx.guild)] });
  } catch {
    return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
  }
}
