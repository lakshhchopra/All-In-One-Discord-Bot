import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";
import { parseVariables } from "../../../../../services/utils/parser.js";
import { parseFunctions, executeSend } from "../../../../../services/utils/placeholder.js";

export async function executeTest(ctx: CommandContext) {
  const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
  const channelId = config?.leaveChannelId;
  if (!channelId) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please configure and enable leave messages first.", ctx.guild)] }, 5);
  }

  const text = config.leaveMessage || "Goodbye {user}!";
  const parsedMessage = parseVariables(text, { user: ctx.member || ctx.user, guild: ctx.guild });

  const channel = ctx.guild.channels.cache.get(channelId);
  if (channel && "send" in channel) {
    const parserCtx = { user: ctx.member || ctx.user, guild: ctx.guild };
    const finalPayload = await parseFunctions(parsedMessage, ctx.guild.id, parserCtx);
    await executeSend(channel, finalPayload, ctx.member || ctx.user, ctx.guild);
    return ctx.reply({ embeds: [UniversalEmbed.success("Sent test leave message.", ctx.guild)] });
  }

  return ctx.reply({ embeds: [UniversalEmbed.error("Configured leave channel is not accessible.", ctx.guild)] }, 5);
}
