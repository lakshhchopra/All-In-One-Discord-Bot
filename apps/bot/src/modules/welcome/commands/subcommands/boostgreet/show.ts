import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeShow(ctx: CommandContext) {
  const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
  return ctx.reply({
    embeds: [
      UniversalEmbed.info("Boost Greeting Configuration", ctx.guild)
        .setDescription(
          `- **Status:** ${config?.boostChannelId ? "🟢 Enabled" : "🔴 Disabled"}\n` +
          `- **Channel:** <#${config?.boostChannelId || "Not set"}>\n` +
          `- **Message Template:** \`${config?.boostMessage || "Thanks {user} for boosting {server}!"}\``
        )
    ]
  });
}
