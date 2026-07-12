import { PermissionFlagsBits, GuildMember, ApplicationCommandOptionType } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

async function fetchAllMembers(guild: any): Promise<GuildMember[]> {
  const members = await guild.members.fetch();
  return [...members.values()];
}

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const rolebotsCommand: Command = {
  name: "rolebots",
  aliases: ["role bots"],
  description: "Give a role to all bots in the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "rolebots <@role>",
  execute: async (ctx: any) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    // if using "role bots <role>", the role will be the 2nd argument (index 1) for prefixed commands if aliases are parsed weirdly
    // Wait, with CommandRegistry, the alias resolves to command name. The args are passed WITHOUT the command name.
    // If the user types `-role bots @role`, `role bots` is the command name, so args[0] is `@role`.
    // Wait! In `context.ts`, args is split by space after the command.
    // If the alias has a space, the command parser in standard bot frameworks sometimes passes the second part as arg[0].
    // Let's check how context handles args. I'll get option 0. If it fails, I'll fallback.
    let role = ctx.getRoleOption("role", 0);
    // If alias was used, args might be ["bots", "@role"]. Let's check args length.
    if (!role && ctx.args[0]?.toLowerCase() === "bots") {
      role = ctx.getRoleOption("role", 1);
    }

    if (!role) return ctx.wrongUsage(rolebotsCommand);

    await ctx.reply({ embeds: [UniversalEmbed.info(`⏳ Assigning **${role.name}** to all bots...`, ctx.guild)] });

    const members = await fetchAllMembers(ctx.guild);
    const bots = members.filter(m => m.user.bot);

    let count = 0;
    for (const m of bots) {
      if (!m.roles.cache.has(role.id)) {
        try {
          await m.roles.add(role.id);
          count++;
          await wait(100);
        } catch {}
      }
    }

    return (ctx.channel as any).send({ embeds: [UniversalEmbed.success(`✅ Assigned **${role.name}** to **${count}** bots.`, ctx.guild)] });
  }
};

