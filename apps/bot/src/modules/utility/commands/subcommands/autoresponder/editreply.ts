import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeEditReply(ctx: CommandContext) {
  const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
  const response = ctx.args.slice(2).join(" ");

  if (!trigger || !response) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder editreply <trigger> <new_response>`", ctx.guild)] }, 5);
  }

  try {
    await prisma.autoResponder.update({
      where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
      data: { response }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder response updated for trigger **${trigger}**.`, ctx.guild)] });
  } catch {
    return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
  }
}
