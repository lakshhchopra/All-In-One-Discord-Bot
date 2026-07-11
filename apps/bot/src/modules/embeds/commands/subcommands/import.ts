import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { redis } from "../../../../services/redis.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export async function executeImport(ctx: CommandContext, name: string) {
  const token = ctx.getStringOption("token", 2);
  let payload: any = null;

  if (token) {
    const cached = await redis.get(`embed_token:${token}`);
    if (!cached) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Invalid or expired import token.", ctx.guild)] }, 5);
    }
    try {
      payload = JSON.parse(cached);
    } catch {}
  } else if (!ctx.isInteraction) {
    const message = ctx.source as any;
    const attachment = message.attachments?.first();
    if (attachment) {
      try {
        const response = await fetch(attachment.url);
        payload = await response.json();
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to parse the attached JSON file.", ctx.guild)] }, 5);
      }
    }
  }

  if (!payload || !payload.embedData) {
    return ctx.reply({ embeds: [UniversalEmbed.error("No valid import token or JSON attachment found.", ctx.guild)] }, 5);
  }

  await prisma.savedEmbed.upsert({
    where: { guildId_name: { guildId: ctx.guild.id, name } },
    create: {
      guildId: ctx.guild.id,
      name,
      content: payload.content || null,
      embedData: payload.embedData
    },
    update: {
      content: payload.content || null,
      embedData: payload.embedData
    }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully imported embed config as \`${name}\`!`, ctx.guild)] });
}
