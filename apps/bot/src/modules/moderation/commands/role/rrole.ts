import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { PermissionFlagsBits, GuildMember } from "discord.js";

export const rroleCommand: Command = {
  name: "rrole",
  description: "Assign a random role to members: all, bots, or humans.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "rrole <all|bots|humans> <@role1> [@role2 ...]",
  examples: [
    "rrole all @RoleA @RoleB @RoleC",
    "rrole bots @BotRole",
    "rrole humans @ColorRole1 @ColorRole2"
  ],
  execute: async (ctx) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need the **Manage Roles** permission.", ctx.guild)] }, 5);
    }

    const sub = ctx.getStringOption("type", 0)?.toLowerCase();
    if (!sub || !["all", "bots", "humans"].includes(sub)) {
      return ctx.reply({
        embeds: [UniversalEmbed.info(
          "**Random Role Assignment**\n" +
          "`rrole all @role1 @role2 ...` — Assign a random role to every member\n" +
          "`rrole bots @role1 @role2 ...` — Assign a random role to each bot\n" +
          "`rrole humans @role1 @role2 ...` — Assign a random role to each human",
          ctx.guild
        )]
      });
    }

    // Collect all role args starting from index 1
    const roleIds: string[] = [];
    for (let i = 1; i < ctx.args.length; i++) {
      const r = ctx.getRoleOption("role", i);
      if (r) roleIds.push(r.id);
    }

    if (roleIds.length === 0) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please provide at least one role to randomly assign.", ctx.guild)] }, 5);
    }

    const allMembers = await ctx.guild.members.fetch();
    let targets: GuildMember[];

    if (sub === "all") targets = [...allMembers.values()];
    else if (sub === "bots") targets = [...allMembers.values()].filter(m => m.user.bot);
    else targets = [...allMembers.values()].filter(m => !m.user.bot);

    await ctx.reply({ embeds: [UniversalEmbed.info(`⏳ Assigning random roles to **${targets.length}** members...`, ctx.guild)] });

    let count = 0;
    for (const m of targets) {
      const randomRoleId = roleIds[Math.floor(Math.random() * roleIds.length)];
      try {
        await m.roles.add(randomRoleId);
        count++;
      } catch {}
    }

    return ctx.reply({ embeds: [UniversalEmbed.success(`✅ Randomly assigned roles to **${count}** members.`, ctx.guild)] });
  }
};
