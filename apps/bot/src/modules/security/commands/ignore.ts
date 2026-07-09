import { Command } from "../../../commands/command.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const ignoreCommand: Command = {
  name: "ignore",
  description: "Configure ignore settings for users, roles, channels, or commands.",
  category: "Security",
  permissionLevel: "OWNER",
  usage: "ignore <user | role | channel | command | bypass> <add | remove | show | reset> [target]",
  examples: [
    "ignore user add @member",
    "ignore role show",
    "ignore channel add #general"
  ],
  execute: async (ctx) => {
    const category = ctx.getStringOption("category", 0)?.toLowerCase(); // user, role, channel, command, bypass
    const action = ctx.getStringOption("action", 1)?.toLowerCase(); // add, remove, show, reset

    if (!category || !["user", "role", "channel", "command", "bypass"].includes(category)) {
      return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `ignore <user | role | channel | command | bypass> <add | remove | show | reset> [target]`", ctx.guild)] });
    }

    const type = `ignore_${category}`;

    if (action === "add") {
      let targetId: string | null = null;
      let targetName = "";

      if (category === "user") {
        const member = ctx.getMemberOption("target", 2);
        targetId = member?.id || null;
        targetName = member?.user.tag || "";
      } else if (category === "role") {
        const role = ctx.getRoleOption("target", 2);
        targetId = role?.id || null;
        targetName = role?.name || "";
      } else if (category === "channel") {
        const channel = ctx.getChannelOption("target", 2);
        targetId = channel?.id || null;
        targetName = (channel as any)?.name || "";
      } else {
        // command or bypass
        const raw = ctx.getStringOption("target", 2);
        targetId = raw || null;
        targetName = raw || "";
      }

      if (!targetId) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Please specify a valid target for ignore ${category}.`, ctx.guild)] }, 5);
      }

      await prisma.whitelist.upsert({
        where: { guildId_targetId: { guildId: ctx.guild.id, targetId } },
        update: { type },
        create: { guildId: ctx.guild.id, targetId, type }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Added **${targetName}** to ignore list for **${category}**.`, ctx.guild)] });
    }

    if (action === "remove") {
      let targetId: string | null = null;
      let targetName = "";

      if (category === "user") {
        const member = ctx.getMemberOption("target", 2);
        targetId = member?.id || null;
        targetName = member?.user.tag || "";
      } else if (category === "role") {
        const role = ctx.getRoleOption("target", 2);
        targetId = role?.id || null;
        targetName = role?.name || "";
      } else if (category === "channel") {
        const channel = ctx.getChannelOption("target", 2);
        targetId = channel?.id || null;
        targetName = (channel as any)?.name || "";
      } else {
        const raw = ctx.getStringOption("target", 2);
        targetId = raw || null;
        targetName = raw || "";
      }

      if (!targetId) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Please specify a valid target to remove.`, ctx.guild)] }, 5);
      }

      try {
        await prisma.whitelist.delete({
          where: { guildId_targetId: { guildId: ctx.guild.id, targetId } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${targetName}** from ignore list.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Target is not in the ignore list.", ctx.guild)] }, 5);
      }
    }

    if (action === "show") {
      const list = await prisma.whitelist.findMany({
        where: { guildId: ctx.guild.id, type }
      });

      const display = list.map(item => {
        if (category === "user") return `<@${item.targetId}>`;
        if (category === "role") return `<@&${item.targetId}>`;
        if (category === "channel") return `<#${item.targetId}>`;
        return `\`${item.targetId}\``;
      }).join(", ") || "None";

      return ctx.reply({ embeds: [UniversalEmbed.info(`Ignore List: ${category}`, ctx.guild).setDescription(display)] });
    }

    if (action === "reset") {
      await prisma.whitelist.deleteMany({
        where: { guildId: ctx.guild.id, type }
      });
      return ctx.reply({ embeds: [UniversalEmbed.success(`Ignore list for **${category}** has been reset.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info(`Usage: \`ignore ${category} [add | remove | show | reset] [target]\``, ctx.guild)] });
  }
};
