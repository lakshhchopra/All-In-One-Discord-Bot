import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export async function executeDelete(ctx: CommandContext, name: string) {
  try {
    await prisma.savedEmbed.delete({
      where: { guildId_name: { guildId: ctx.guild.id, name } }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully deleted saved embed \`${name}\`.`, ctx.guild)] });
  } catch {
    return ctx.reply({ embeds: [UniversalEmbed.error(`Embed \`${name}\` not found.`, ctx.guild)] }, 5);
  }
}
