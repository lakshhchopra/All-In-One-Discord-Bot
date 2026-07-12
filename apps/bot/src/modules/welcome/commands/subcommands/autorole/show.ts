import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeShow(ctx: CommandContext) {
  const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
  const humans = config?.autoRolesHumans.map(id => `<@&${id}>`).join(", ") || "None";
  const bots = config?.autoRolesBots.map(id => `<@&${id}>`).join(", ") || "None";

  const embed = UniversalEmbed.info("Auto Roles List", ctx.guild)
    .addFields(
      { name: "Humans Auto Roles", value: humans },
      { name: "Bots Auto Roles", value: bots }
    );
  return ctx.reply({ embeds: [embed] });
}
