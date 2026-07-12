import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeAdd(ctx: CommandContext) {
  const messageId = ctx.getStringOption("messageId", 1);
  const emoji = ctx.getStringOption("emoji", 2);
  const role = ctx.getRoleOption("role", 3);

  if (!messageId || !emoji || !role) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `reactionrole add <messageId> <emoji> <role>`", ctx.guild)] }, 5);
  }

  await prisma.reactionRole.create({
    data: {
      guildId: ctx.guild.id,
      channelId: ctx.channel.id,
      messageId,
      emoji,
      roleId: role.id
    }
  });

  try {
    const msg = await ctx.channel.messages.fetch(messageId);
    await msg.react(emoji);
  } catch {}

  return ctx.reply({ embeds: [UniversalEmbed.success(`Reaction role mapped successfully on message **${messageId}**`, ctx.guild)] });
}
