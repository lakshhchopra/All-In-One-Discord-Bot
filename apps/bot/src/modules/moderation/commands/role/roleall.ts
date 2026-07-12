import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const roleallCommand: Command = {
  name: "roleall",
  description: "Give a role to all members in the server.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "roleall <role>",
  examples: ["roleall @Member"],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    const role = ctx.getRoleOption("role", 0);
    if (!role) return ctx.wrongUsage(roleallCommand);

    await ctx.reply({ embeds: [UniversalEmbed.info(`Adding role **${role.name}** to all members... This may take a moment.`, ctx.guild)] });

    const members = await ctx.guild.members.fetch();
    let count = 0;
    for (const [_, member] of members) {
      if (!member.roles.cache.has(role.id)) {
        try {
          await member.roles.add(role.id);
          count++;
        } catch {}
      }
    }

    return (ctx.channel as any).send({ embeds: [UniversalEmbed.success(`Successfully added role **${role.name}** to **${count}** member(s).`, ctx.guild)] });
  }
};
