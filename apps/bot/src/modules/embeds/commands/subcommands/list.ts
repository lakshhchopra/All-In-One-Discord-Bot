import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { EMOJIS } from "../../../../config/emojis.js";

export async function executeList(ctx: CommandContext) {
  const embedsList = await prisma.savedEmbed.findMany({
    where: { guildId: ctx.guild.id }
  });

  if (embedsList.length === 0) {
    return ctx.reply({ embeds: [UniversalEmbed.info("No custom embeds have been saved in this server.", ctx.guild)] });
  }

  const listStr = embedsList.map(e => `• **${e.name}** - Created <t:${Math.floor(e.createdAt.getTime() / 1000)}:R>`).join("\n");
  const listEmbed = new UniversalEmbed("neutral", undefined, ctx.guild)
    .setTitle(`${EMOJIS.media} Saved Embeds`)
    .setDescription(listStr)
    .setFooter({ text: `Total Custom Embeds: ${embedsList.length}` });

  return ctx.reply({ embeds: [listEmbed] });
}
