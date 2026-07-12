import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const trustedCommand: Command = {
  name: "trusted",
  description: "Configure trusted moderators allowed to execute bot moderation commands.",
  category: "Security",
  permissionLevel: "OWNER",
  usage: "trusted <add | remove | show | reset> [@user | @role]",
  examples: [
    "trusted add @Moderator",
    "trusted remove @User",
    "trusted show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const user = ctx.getMemberOption("member", 1);
      const role = ctx.getRoleOption("role", 1);
      if (!user && !role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user or role to trust.", ctx.guild)] }, 5);
      }

      const id = user?.id || role?.id;
      const type = user ? "trusted" : "trusted_role";
      const name = user ? user.user.tag : role?.name;

      await prisma.whitelist.upsert({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId: id! } },
        update: { type },
        create: { guildId: ctx.guild.id, targetId: id!, type }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${name}** to trusted list.`, ctx.guild)] });
    }

    if (action === "remove") {
      const user = ctx.getMemberOption("member", 1);
      const role = ctx.getRoleOption("role", 1);
      if (!user && !role) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user or role to untrust.", ctx.guild)] }, 5);
      }

      const id = user?.id || role?.id;
      const name = user ? user.user.tag : role?.name;

      try {
        await prisma.whitelist.delete({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: id! } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${name}** from trusted list.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Target is not in the trusted list.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const list = await prisma.whitelist.findMany({
        where: {
          guildId: ctx.guild.id,
          type: { in: ["trusted", "trusted_role"] }
        }
      });

      const usersText = list
        .filter(wl => wl.type === "trusted")
        .map(wl => `<@${wl.targetId}>`)
        .join(", ") || "None";

      const rolesText = list
        .filter(wl => wl.type === "trusted_role")
        .map(wl => `<@&${wl.targetId}>`)
        .join(", ") || "None";

      return ctx.reply({
        embeds: [
          UniversalEmbed.info("Trusted Moderation Access List", ctx.guild)
            .addFields(
              { name: "Trusted Users", value: usersText },
              { name: "Trusted Roles", value: rolesText }
            )
        ]
      });
    }

    if (action === "reset") {
      await prisma.whitelist.deleteMany({
        where: {
          guildId: ctx.guild.id,
          type: { in: ["trusted", "trusted_role"] }
        }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Trusted list reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `trusted [add|remove|show|reset] [@user | @role]`", ctx.guild)] });
  }
};
