import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeRename(ctx: CommandContext) {
  const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
  const newTrigger = ctx.getStringOption("value", 2)?.toLowerCase();

  if (!trigger || !newTrigger) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoreact rename <old_trigger> <new_trigger>`", ctx.guild)] }, 5);
  }

  try {
    const entry = await prisma.autoReact.findUnique({
      where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
    });

    if (!entry) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Auto reaction trigger not found.", ctx.guild)] }, 5);
    }

    await prisma.autoReact.delete({
      where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
    });

    await prisma.autoReact.create({
      data: {
        guildId: ctx.guild.id,
        trigger: newTrigger,
        emojis: entry.emojis
      }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Auto reaction trigger **${trigger}** renamed to **${newTrigger}**.`, ctx.guild)] });
  } catch (err) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Failed to rename. The new trigger may already exist.", ctx.guild)] }, 5);
  }
}
