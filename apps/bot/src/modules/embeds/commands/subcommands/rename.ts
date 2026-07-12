import { CommandContext } from "../../../../commands/context.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";

// Helper to validate alphanumeric name
function isValidName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

export async function executeRename(ctx: CommandContext, name: string) {
  const newName = ctx.getStringOption("new_name", 2)?.toLowerCase();
  if (!newName || !isValidName(newName)) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please provide a valid new alphanumeric name.", ctx.guild)] }, 5);
  }

  const exists = await prisma.savedEmbed.findUnique({
    where: { guildId_name: { guildId: ctx.guild.id, name } }
  });

  if (!exists) {
    return ctx.reply({ embeds: [UniversalEmbed.error(`Saved embed \`${name}\` does not exist.`, ctx.guild)] }, 5);
  }

  const targetExists = await prisma.savedEmbed.findUnique({
    where: { guildId_name: { guildId: ctx.guild.id, name: newName } }
  });

  if (targetExists) {
    return ctx.reply({ embeds: [UniversalEmbed.error(`An embed named \`${newName}\` already exists.`, ctx.guild)] }, 5);
  }

  await prisma.savedEmbed.update({
    where: { guildId_name: { guildId: ctx.guild.id, name } },
    data: { name: newName }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Successfully renamed embed \`${name}\` to \`${newName}\`.`, ctx.guild)] });
}
