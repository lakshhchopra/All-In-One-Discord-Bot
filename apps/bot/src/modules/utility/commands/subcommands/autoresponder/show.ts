import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeShow(ctx: CommandContext) {
  const list = await prisma.autoResponder.findMany({ where: { guildId: ctx.guild.id } });
  const respondersList = list.map(item => `• **${item.trigger}** → ${item.response}`).join("\n") || "No custom auto responders configured.";

  const embed = UniversalEmbed.info("Auto Responders List", ctx.guild)
    .setDescription(respondersList);
  return ctx.reply({ embeds: [embed] });
}
