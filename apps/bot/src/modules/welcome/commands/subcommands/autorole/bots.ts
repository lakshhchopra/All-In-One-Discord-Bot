import { CommandContext } from "../../../../../commands/context.js";
import { prisma } from "../../../../../services/db.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeBots(ctx: CommandContext) {
  const sub = ctx.getStringOption("sub", 1)?.toLowerCase();

  if (sub === "enable") {
    return ctx.reply({ embeds: [UniversalEmbed.success("Bot auto roles are **enabled**.", ctx.guild)] });
  }
  if (sub === "disable") {
    return ctx.reply({ embeds: [UniversalEmbed.success("Bot auto roles are **disabled**.", ctx.guild)] });
  }

  const role = ctx.getRoleOption("role", 2);
  const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
  let roles = config?.autoRolesBots ?? [];

  if (sub === "add") {
    if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to add.", ctx.guild)] }, 5);
    if (!roles.includes(role.id)) roles.push(role.id);
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { autoRolesBots: roles },
      create: { guildId: ctx.guild.id, autoRolesBots: roles }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Added ${role} to bot auto roles.`, ctx.guild)] });
  }

  if (sub === "remove") {
    if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to remove.", ctx.guild)] }, 5);
    roles = roles.filter(r => r !== role.id);
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { autoRolesBots: roles },
      create: { guildId: ctx.guild.id, autoRolesBots: roles }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success(`Removed ${role} from bot auto roles.`, ctx.guild)] });
  }

  if (sub === "show" || !sub) {
    const listText = roles.map(id => `<@&${id}>`).join(", ") || "None";
    return ctx.reply({ embeds: [UniversalEmbed.info("Bot Auto Roles", ctx.guild).setDescription(listText)] });
  }

  if (sub === "reset") {
    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { autoRolesBots: [] },
      create: { guildId: ctx.guild.id, autoRolesBots: [] }
    });
    return ctx.reply({ embeds: [UniversalEmbed.success("Bot auto roles list reset.", ctx.guild)] });
  }

  return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand \`bots ${sub}\`.`, ctx.guild)] }, 5);
}
