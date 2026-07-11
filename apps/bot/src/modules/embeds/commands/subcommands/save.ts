import { Message } from "discord.js";
import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export async function executeSave(ctx: CommandContext, name: string) {
  let targetMessageId = ctx.getStringOption("message_id", 2);

  // Check if replying
  if (!targetMessageId && !ctx.isInteraction) {
    const message = ctx.source as any;
    if (message.reference && message.reference.messageId) {
      targetMessageId = message.reference.messageId;
    }
  }

  if (!targetMessageId) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please reply to a message containing the embed, or provide the message ID.", ctx.guild)] }, 5);
  }

  const channel = ctx.isInteraction ? ctx.source.channel : (ctx.source as any).channel;
  const targetMessage = await channel.messages.fetch(targetMessageId).catch(() => null) as Message | null;

  if (!targetMessage) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Could not find the target message in this channel.", ctx.guild)] }, 5);
  }

  const embedToSave = targetMessage.embeds[0];
  if (!embedToSave) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Target message does not contain any embeds.", ctx.guild)] }, 5);
  }

  const embedData = embedToSave.toJSON();

  await prisma.savedEmbed.upsert({
    where: { guildId_name: { guildId: ctx.guild.id, name } },
    create: {
      guildId: ctx.guild.id,
      name,
      content: targetMessage.content || null,
      embedData: embedData as any
    },
    update: {
      content: targetMessage.content || null,
      embedData: embedData as any
    }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully saved embed from message as \`${name}\`.`, ctx.guild)] });
}
