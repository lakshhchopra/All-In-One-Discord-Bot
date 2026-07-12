import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeRemove(ctx: CommandContext) {
  try {
    const sticky = await prisma.stickyMessage.findUnique({
      where: { channelId: ctx.channel.id }
    });

    if (sticky && sticky.lastMessageId) {
      try {
        const oldMsg = await ctx.channel.messages.fetch(sticky.lastMessageId);
        await oldMsg.delete();
      } catch {}
    }

    await prisma.stickyMessage.delete({
      where: { channelId: ctx.channel.id }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success("Sticky message removed from this channel.", ctx.guild)] });
  } catch {
    return ctx.reply({ embeds: [UniversalEmbed.error("No sticky message configured in this channel.", ctx.guild)] }, 5);
  }
}
