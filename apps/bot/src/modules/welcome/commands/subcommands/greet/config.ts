import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeConfig(ctx: CommandContext) {
  const config = (await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } })) as any;
  return ctx.reply({
    embeds: [
      UniversalEmbed.info("Welcomer Configuration", ctx.guild)
        .setDescription(
          `- **Enabled:** ${config?.welcomeDmEnabled ? "🟢 Yes" : "🔴 No"}\n` +
          `- **Channel:** <#${config?.welcomeChannelId || "Not set"}>\n` +
          `- **Message:** \`${config?.welcomeMessage || "Welcome {user} to {server}!"}\`\n` +
          `- **Type:** \`${config?.welcomeType || "both"}\`\n` +
          `- **Auto Delete:** \`${config?.welcomeAutoDelete ? `${config.welcomeAutoDelete}s` : "Disabled"}\``
        )
    ]
  });
}
