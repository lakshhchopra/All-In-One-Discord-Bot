import { CommandContext } from "../../../../../commands/context.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeEnable(ctx: CommandContext) {
  return ctx.reply({ embeds: [UniversalEmbed.success("Auto roles system is **enabled**.", ctx.guild)] });
}
