import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeMessage(ctx: CommandContext) {
  const msg = ctx.args.slice(1).join(" ");
  if (!msg) {
    return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a welcome message template. Example: `Welcome {user} to our server!`", ctx.guild)] }, 5);
  }

  await prisma.guildConfig.upsert({
    where: { guildId: ctx.guild.id },
    update: { welcomeMessage: msg },
    create: { guildId: ctx.guild.id, welcomeMessage: msg }
  });

  return ctx.reply({ embeds: [UniversalEmbed.success(`Welcome message template set to: \`${msg}\``, ctx.guild)] });
}
