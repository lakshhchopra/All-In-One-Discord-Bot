import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const inviteRewardCommand: Command = {
  name: "invitereward",
  description: "Configure role rewards for invites.",
  category: "Invite Tracking",
  permissionLevel: "ADMIN",
  usage: "invitereward <add | remove | list> [inviteCount] [role]",
  examples: [
    "invitereward add 5 @Active Member",
    "invitereward remove 5",
    "invitereward list"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const inviteCount = ctx.getIntegerOption("count", 1);
      const role = ctx.getRoleOption("role", 2);

      if (inviteCount === null || !role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `invitereward add <inviteCount> <role>`", ctx.guild)] }, 5);
      }

      await prisma.inviteReward.upsert({
        where: { guildId_inviteCount: { guildId: ctx.guild.id, inviteCount } },
        update: { roleId: role.id },
        create: { guildId: ctx.guild.id, inviteCount, roleId: role.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added reward: Users with **${inviteCount}** invites will receive ${role}.`, ctx.guild)] });
    }

    if (action === "remove") {
      const inviteCount = ctx.getIntegerOption("count", 1);
      if (inviteCount === null) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `invitereward remove <inviteCount>`", ctx.guild)] }, 5);

      try {
        await prisma.inviteReward.delete({
          where: { guildId_inviteCount: { guildId: ctx.guild.id, inviteCount } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed reward for **${inviteCount}** invites.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Reward mapping not found.", ctx.guild)] }, 5);
      }
    }

    // List rewards
    const list = await prisma.inviteReward.findMany({ where: { guildId: ctx.guild.id } });
    const rewardDesc = list.map(item => `• **${item.inviteCount} Invites:** <@&${item.roleId}>`).join("\n") || "No invite rewards configured.";

    return ctx.reply({ embeds: [UniversalEmbed.info("Invite Role Rewards List", ctx.guild).setDescription(rewardDesc)] });
  }
};
