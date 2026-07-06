import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";

export const antinukeCommand: Command = {
  name: "antinuke",
  description: "Configure Anti-Nuke options.",
  category: "Security",
  permissionLevel: "OWNER",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // setup, enable, disable, log, limits

    if (action === "enable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiNukeEnabled: true },
        create: { guildId: ctx.guild.id, antiNukeEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Nuke system enabled.", ctx.guild)] });
    }

    if (action === "disable") {
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiNukeEnabled: false },
        create: { guildId: ctx.guild.id, antiNukeEnabled: false }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Nuke system disabled.", ctx.guild)] });
    }

    if (action === "setup") {
      // Setup defaults
      const defaultLimits = {
        channelDelete: 3,
        roleDelete: 3,
        banKick: 5,
        webhookCreate: 2
      };
      await prisma.guildConfig.upsert({
        where: { guildId: ctx.guild.id },
        update: { antiNukeLimits: defaultLimits, antiNukeEnabled: true },
        create: { guildId: ctx.guild.id, antiNukeLimits: defaultLimits, antiNukeEnabled: true }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success("Anti-Nuke configured and enabled with default limits: 3 channel/role deletes and 5 bans/kicks within a minute.", ctx.guild)] });
    }

    if (action === "log") {
      const logs = await prisma.auditLog.findMany({
        where: { guildId: ctx.guild.id, action: { startsWith: "Antinuke" } },
        orderBy: { createdAt: "desc" },
        take: 5
      });
      const desc = logs.map(l => `• **${l.createdAt.toLocaleTimeString()}** - ${l.action}: ${l.reason}`).join("\n") || "No Anti-Nuke triggers recorded.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Anti-Nuke Security Logs", ctx.guild).setDescription(desc)] });
    }

    // Individual limits setup (like: channel, role, emoji, ban)
    const limitName = action; // can be channel, role, spam, etc.
    const limitVal = ctx.getIntegerOption("limit", 1);
    if (limitVal !== null && limitName) {
      const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } });
      const currentLimits = (config?.antiNukeLimits as Record<string, number>) ?? {};
      currentLimits[limitName] = limitVal;

      await prisma.guildConfig.update({
        where: { guildId: ctx.guild.id },
        data: { antiNukeLimits: currentLimits }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Anti-Nuke limit for **${limitName}** updated to \`${limitVal}\``, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `antinuke [enable|disable|setup|log|[category]] [limit]`", ctx.guild)] });
  }
};

export const whitelistCommand: Command = {
  name: "whitelist",
  description: "Whitelist members or roles from security triggers.",
  category: "Security",
  permissionLevel: "OWNER",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // role, show, reset

    if (action === "role") {
      const sub = ctx.getStringOption("sub", 1); // add, remove
      const role = ctx.getRoleOption("role", 2);
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role.", ctx.guild)] }, 5);

      if (sub === "add") {
        await prisma.whitelist.upsert({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } },
          update: { type: "role" },
          create: { guildId: ctx.guild.id, targetId: role.id, type: "role" }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Role ${role} added to whitelist.`, ctx.guild)] });
      }

      if (sub === "remove") {
        try {
          await prisma.whitelist.delete({
            where: { guildId_targetId: { guildId: ctx.guild.id, targetId: role.id } }
          });
          return ctx.reply({ embeds: [UniversalEmbed.success(`Role ${role} removed from whitelist.`, ctx.guild)] });
        } catch {
          return ctx.reply({ embeds: [UniversalEmbed.error("Role is not in whitelist.", ctx.guild)] }, 5);
        }
      }
    }

    // General user add/remove
    if (action === "add") {
      const targetUser = ctx.getMemberOption("member", 1);
      if (!targetUser) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to whitelist.", ctx.guild)] }, 5);

      await prisma.whitelist.upsert({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId: targetUser.id } },
        update: { type: "user" },
        create: { guildId: ctx.guild.id, targetId: targetUser.id, type: "user" }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Member **${targetUser.user.tag}** whitelisted successfully.`, ctx.guild)] });
    }

    if (action === "remove") {
      const targetUser = ctx.getMemberOption("member", 1);
      if (!targetUser) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user to remove.", ctx.guild)] }, 5);

      try {
        await prisma.whitelist.delete({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId: targetUser.id } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Member **${targetUser.user.tag}** removed from whitelist.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Member is not in whitelist.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const list = await prisma.whitelist.findMany({ where: { guildId: ctx.guild.id } });
      const roles = list.filter(w => w.type === "role").map(w => `<@&${w.targetId}>`).join(", ") || "None";
      const users = list.filter(w => w.type === "user").map(w => `<@${w.targetId}>`).join(", ") || "None";

      const embed = UniversalEmbed.info("Security Whitelist Configuration", ctx.guild)
        .addFields(
          { name: "Whitelisted Roles", value: roles },
          { name: "Whitelisted Users", value: users }
        );
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      await prisma.whitelist.deleteMany({ where: { guildId: ctx.guild.id } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Security whitelist has been reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `whitelist [add|remove|show|reset|role] ...`", ctx.guild)] });
  }
};

export const extraownerCommand: Command = {
  name: "extraowner",
  description: "Configure Extra Owners for full bypass control.",
  category: "Security",
  permissionLevel: "OWNER",
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0); // add, remove, show, reset

    if (action === "add") {
      const member = ctx.getMemberOption("member", 1);
      if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user.", ctx.guild)] }, 5);

      await prisma.extraOwner.upsert({
        where: { guildId_userId: { guildId: ctx.guild.id, userId: member.id } },
        update: {},
        create: { guildId: ctx.guild.id, userId: member.id }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${member.user.tag}** to Extra Owners.`, ctx.guild)] });
    }

    if (action === "remove") {
      const member = ctx.getMemberOption("member", 1);
      if (!member) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a user.", ctx.guild)] }, 5);

      try {
        await prisma.extraOwner.delete({
          where: { guildId_userId: { guildId: ctx.guild.id, userId: member.id } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${member.user.tag}** from Extra Owners.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("User is not an Extra Owner.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const list = await prisma.extraOwner.findMany({ where: { guildId: ctx.guild.id } });
      const owners = list.map(o => `<@${o.userId}>`).join(", ") || "None";
      return ctx.reply({ embeds: [UniversalEmbed.info("Extra Owners", ctx.guild).setDescription(owners)] });
    }

    if (action === "reset") {
      await prisma.extraOwner.deleteMany({ where: { guildId: ctx.guild.id } });
      return ctx.reply({ embeds: [UniversalEmbed.success("Extra Owners list reset.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `extraowner [add|remove|show|reset] [member]`", ctx.guild)] });
  }
};

export function registerSecurity() {
  CommandRegistry.register(antinukeCommand);
  CommandRegistry.register(whitelistCommand);
  CommandRegistry.register(extraownerCommand);
}
