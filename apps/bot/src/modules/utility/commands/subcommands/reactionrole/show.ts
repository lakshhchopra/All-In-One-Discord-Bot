import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeShow(ctx: CommandContext) {
  const list = await prisma.reactionRole.findMany({ where: { guildId: ctx.guild.id } });
  const rrList = list.map(item => `• Message: [${item.messageId}](https://discord.com/channels/${ctx.guild.id}/${item.channelId}/${item.messageId}) | Emoji: ${item.emoji} | Role: <@&${item.roleId}>`).join("\n") || "No reaction roles configured.";

  const embed = UniversalEmbed.info("Reaction Roles List", ctx.guild)
    .setDescription(rrList);
  return ctx.reply({ embeds: [embed] });
}
