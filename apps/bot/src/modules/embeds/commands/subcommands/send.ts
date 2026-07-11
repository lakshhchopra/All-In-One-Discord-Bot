import { TextChannel, WebhookClient } from "discord.js";
import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { parseVariables, parseObjectVariables } from "../../../../services/utils/parser.js";

export async function executeSend(ctx: CommandContext, name: string) {
  const saved = await prisma.savedEmbed.findUnique({
    where: { guildId_name: { guildId: ctx.guild.id, name } }
  });

  if (!saved) {
    return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` not found.`, ctx.guild)] }, 5);
  }

  const rawEmbedData = saved.embedData as any;
  const rawContent = saved.content || "";

  const parsedContent = parseVariables(rawContent, { user: ctx.member || ctx.user, guild: ctx.guild });
  const parsedEmbedData = parseObjectVariables(rawEmbedData, { user: ctx.member || ctx.user, guild: ctx.guild });

  const targetChannelOption = ctx.getChannelOption("channel", 2);
  const targetChannel = (targetChannelOption as TextChannel) || (ctx.isInteraction ? ctx.source.channel : (ctx.source as any).channel);

  const webhookUrl = ctx.getStringOption("webhook_url", 3);
  const webhookName = ctx.getStringOption("webhook_name", 4);
  const webhookAvatar = ctx.getStringOption("webhook_avatar", 5);

  if (webhookUrl) {
    try {
      const webhook = new WebhookClient({ url: webhookUrl });
      await webhook.send({
        content: parsedContent || undefined,
        embeds: [parsedEmbedData],
        username: webhookName || undefined,
        avatarURL: webhookAvatar || undefined
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully sent embed \`${name}\` via Webhook.`, ctx.guild)] });
    } catch (err: any) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`Webhook execution failed: ${err.message}`, ctx.guild)] }, 5);
    }
  }

  if (targetChannel && "send" in targetChannel) {
    await targetChannel.send({ content: parsedContent || undefined, embeds: [parsedEmbedData] });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully sent embed \`${name}\` in ${targetChannel}.`, ctx.guild)] });
  }

  return ctx.reply({ embeds: [UniversalEmbed.error("Invalid target channel.", ctx.guild)] }, 5);
}
