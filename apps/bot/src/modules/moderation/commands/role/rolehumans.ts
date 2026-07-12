import { PermissionFlagsBits, GuildMember, ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

async function fetchAllMembers(guild: any): Promise<GuildMember[]> {
  const members = await guild.members.fetch();
  return [...members.values()];
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const rolehumansCommand: Command = {
  name: "rolehumans",
  aliases: ["role humans"],
  description: "Give a role to all humans in the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "rolehumans <@role>",
  execute: async (ctx: any) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    let role = ctx.getRoleOption("role", 0);
    if (!role && ctx.args[0]?.toLowerCase() === "humans") {
      role = ctx.getRoleOption("role", 1);
    }

    if (!role) return ctx.wrongUsage(rolehumansCommand);

    await ctx.reply({ embeds: [UniversalEmbed.info(`⏳ Assigning **${role.name}** to all humans...`, ctx.guild)] });

    const members = await fetchAllMembers(ctx.guild);
    const humans = members.filter(m => !m.user.bot);

    let count = 0;
    for (const m of humans) {
      if (!m.roles.cache.has(role.id)) {
        try {
          await m.roles.add(role.id);
          count++;
          await wait(100);
        } catch {}
      }
    }

    return (ctx.channel as any).send({ embeds: [UniversalEmbed.success(`✅ Assigned **${role.name}** to **${count}** humans.`, ctx.guild)] });
  }
};

