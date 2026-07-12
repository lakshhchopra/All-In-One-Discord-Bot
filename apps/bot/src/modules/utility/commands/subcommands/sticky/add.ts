import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeAdd(ctx: CommandContext) {
  const message = ctx.args.slice(1).join(" ");
  if (!message) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please specify the sticky message text.", ctx.guild)] }, 5);
  }

  await prisma.stickyMessage.upsert({
    where: { channelId: ctx.channel.id },
    update: { message, lastMessageId: null },
    create: { guildId: ctx.guild.id, channelId: ctx.channel.id, message }
  });

  // Send the initial sticky message
  const sent = await (ctx.channel as any).send({
    embeds: [
      new UniversalEmbed("neutral", undefined, ctx.guild)
        .setDescription(`📌 **Sticky Message**\n\n${message}`)
    ]
  });

  await prisma.stickyMessage.update({
    where: { channelId: ctx.channel.id },
    data: { lastMessageId: sent.id }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success("Sticky message configured successfully.", ctx.guild)] }, 5);
}
