import { CommandContext } from "../../../../../commands/context.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeDisable(ctx: CommandContext) {
  return ctx.reply({ embeds: [UniversalEmbed.success("Auto roles system is **disabled**.", ctx.guild)] });
}
