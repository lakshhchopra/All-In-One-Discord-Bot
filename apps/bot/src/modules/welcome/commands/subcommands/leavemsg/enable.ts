import { ChannelType } from "discord.js";
import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeEnable(ctx: CommandContext) {
  const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
  let channelId = config?.leaveChannelId;
  if (!channelId) {
    // Fallback: look for a channel named leave or goodbye
    const channel = ctx.guild.channels.cache.find(c =>
      (c.name.includes("leave") || c.name.includes("goodbye") || c.name.includes("welcome")) &&
      c.type === ChannelType.GuildText
    );
    if (channel) channelId = channel.id;
  }

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { leaveChannelId: channelId },
    create: { guildId: ctx.guild.id, leaveChannelId: channelId }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Leave messages **enabled**. Active channel: <#${channelId || "Not configured"}>`, ctx.guild)] });
}
