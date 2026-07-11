import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeShow(ctx: CommandContext) {
  const list = await prisma.autoReact.findMany({ where: { guildId: ctx.guild.id } });
  const description = list.map(item => `• **${item.trigger}** → ${item.emojis.join(" ")}`).join("\n") || "No custom auto reactors configured.";

  const embed = UniversalEmbed.info("Auto Reactors List", ctx.guild)
    .setDescription(description);
  return ctx.reply({ embeds: [embed] });
}
