import { AttachmentBuilder } from "discord.js";
import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { redis } from "../../../../services/redis.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export async function executeExport(ctx: CommandContext, name: string) {
  const exportType = ctx.getStringOption("type", 2)?.toLowerCase();
  if (exportType !== "file" && exportType !== "token") {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please specify export type as either `file` or `token`.", ctx.guild)] }, 5);
  }

  const saved = await prisma.savedEmbed.findUnique({
    where: { guildId_name: { guildId: ctx.guild.id, name } }
  });

  if (!saved) {
    return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` not found.`, ctx.guild)] }, 5);
  }

  const payload = {
    name: saved.name,
    content: saved.content,
    embedData: saved.embedData
  };

  if (exportType === "file") {
    const buffer = Buffer.from(JSON.stringify(payload, null, 2), "utf-8");
    const attachment = new AttachmentBuilder(buffer, { name: `${name}_embed.json` });
    return ctx.reply({
      embeds: [UniversalEmbed.success(`Here is the exported file for \`${name}\`:`, ctx.guild)],
      files: [attachment]
    });
  }

  // Generate a temporary 15-minute token
  const token = Math.random().toString(36).substring(2, 10).toUpperCase();
  await redis.setex(`embed_token:${token}`, 900, JSON.stringify(payload));

  return ctx.reply({
    embeds: [UniversalEmbed.success(`🔑 **Token generated!** Use this to import: \`${token}\` (Expires in 15 minutes).`, ctx.guild)]
  });
}
