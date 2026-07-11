import { ChannelType } from "discord.js";
import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeCreate(ctx: CommandContext) {
  const channel = await ctx.guild.channels.create({
    name: "welcome",
    type: ChannelType.GuildText,
    reason: "Automatic welcomer setup"
  });

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { welcomeChannelId: channel.id },
    create: { guildId: ctx.guild.id, welcomeChannelId: channel.id }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Created channel ${channel} and set it as welcome channel.`, ctx.guild)] });
}
