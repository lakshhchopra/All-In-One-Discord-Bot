import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeShow(ctx: CommandContext) {
  const sticky = await prisma.stickyMessage.findUnique({
    where: { channelId: ctx.channel.id }
  });

  if (!sticky) {
    return ctx.reply({ embeds: [UniversalEmbed.info("No sticky message configured in this channel.", ctx.guild)] });
  }

  return ctx.reply({
    embeds: [
      UniversalEmbed.info("Sticky Message Config", ctx.guild)
        .setDescription(`📌 **Message:** ${sticky.message}`)
    ]
  });
}
