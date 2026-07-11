import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeRename(ctx: CommandContext) {
  const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
  const newTrigger = ctx.getStringOption("value", 2)?.toLowerCase();

  if (!trigger || !newTrigger) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder rename <old_trigger> <new_trigger>`", ctx.guild)] }, 5);
  }

  try {
    const entry = await prisma.autoResponder.findUnique({
      where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
    });

    if (!entry) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
    }

    // Delete old and create new to avoid key conflicts
    await prisma.autoResponder.delete({
      where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
    });

    await prisma.autoResponder.create({
      data: {
        guildId: ctx.guild.id,
        trigger: newTrigger,
        response: entry.response,
        matchType: entry.matchType
      }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder trigger **${trigger}** renamed to **${newTrigger}**.`, ctx.guild)] });
  } catch (err) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Failed to rename auto responder. The new trigger may already exist.", ctx.guild)] }, 5);
  }
}
