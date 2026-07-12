import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { parseVariables, parseObjectVariables } from "../../../../services/utils/parser.js";

export async function executeShow(ctx: CommandContext, name: string) {
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

  return ctx.reply({ content: parsedContent || undefined, embeds: [parsedEmbedData] });
}
