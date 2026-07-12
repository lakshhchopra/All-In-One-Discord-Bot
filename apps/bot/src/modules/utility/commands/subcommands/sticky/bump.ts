import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeBump(ctx: CommandContext) {
  const sticky = await prisma.stickyMessage.findUnique({
    where: { channelId: ctx.channel.id }
  });

  if (!sticky) {
    return ctx.reply({ embeds: [UniversalEmbed.error("No sticky message found to bump.", ctx.guild)] }, 5);
  }

  if (sticky.lastMessageId) {
    try {
      const oldMsg = await ctx.channel.messages.fetch(sticky.lastMessageId);
      await oldMsg.delete();
    } catch {}
  }

  const sent = await (ctx.channel as any).send({
    embeds: [
      new UniversalEmbed("neutral", undefined, ctx.guild)
        .setDescription(`📌 **Sticky Message**\n\n${sticky.message}`)
    ]
  });

  await prisma.stickyMessage.update({
    where: { channelId: ctx.channel.id },
    data: { lastMessageId: sent.id }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success("Sticky message bumped successfully.", ctx.guild)] }, 5);
}
