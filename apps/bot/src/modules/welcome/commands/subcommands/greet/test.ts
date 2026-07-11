import { EmbedBuilder } from "discord.js";
import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";
import { parseVariables } from "../../../../../services/utils/parser.js";
import { parseFunctions, executeSend } from "../../../../../services/utils/placeholder.js";

export async function executeTest(ctx: CommandContext) {
  const config = (await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } })) as any;
  const channelId = config?.welcomeChannelId;
  if (!channelId) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please configure and enable a welcome channel first.", ctx.guild)] }, 5);
  }

  const ch = ctx.guild.channels.cache.get(channelId);
  if (!ch || !("send" in ch)) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Welcome channel is not accessible or not a text channel.", ctx.guild)] }, 5);
  }

  const template = config?.welcomeMessage || "Welcome {mention} to {server}!";
  const parserCtx = { user: ctx.member || ctx.user, guild: ctx.guild };
  const parsedMessage = parseVariables(template, parserCtx);

  let finalPayload: any;

  if (parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:")) {
    finalPayload = await parseFunctions(parsedMessage, ctx.guild.id, parserCtx);
  } else {
    const welcomeType = config?.welcomeType || "both";
    if (welcomeType === "normal") {
      finalPayload = { content: parsedMessage };
    } else {
      const embed = new EmbedBuilder()
        .setTitle(`Welcome to ${ctx.guild.name}!`)
        .setDescription(parsedMessage)
        .setThumbnail(ctx.user.displayAvatarURL({ extension: "png" }))
        .setColor(0x3498db)
        .setTimestamp();

      if (welcomeType === "embed") {
        finalPayload = { embeds: [embed] };
      } else {
        // both
        finalPayload = {
          content: `Welcome ${ctx.member || ctx.user}!`,
          embeds: [embed]
        };
      }
    }
  }

  await executeSend(ch, finalPayload, ctx.member || ctx.user, ctx.guild);
  const modeText = parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:") ? "custom embed" : config?.welcomeType || "both";
  return ctx.reply({ embeds: [UniversalEmbed.success(`Sent test welcome message to <#${channelId}> (Mode: **${modeText}**).`, ctx.guild)] });
}
