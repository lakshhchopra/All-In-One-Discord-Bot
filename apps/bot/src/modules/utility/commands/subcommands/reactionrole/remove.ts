import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeRemove(ctx: CommandContext) {
  const messageId = ctx.getStringOption("messageId", 1);
  const emoji = ctx.getStringOption("emoji", 2);
  const role = ctx.getRoleOption("role", 3);

  if (!messageId || !emoji || !role) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `reactionrole remove <messageId> <emoji> <role>`", ctx.guild)] }, 5);
  }

  try {
    await prisma.reactionRole.delete({
      where: {
        messageId_emoji_roleId: { messageId, emoji, roleId: role.id }
      }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Reaction role mapping removed.`, ctx.guild)] });
  } catch {
    return ctx.reply({ embeds: [UniversalEmbed.error("Reaction role mapping not found.", ctx.guild)] }, 5);
  }
}
