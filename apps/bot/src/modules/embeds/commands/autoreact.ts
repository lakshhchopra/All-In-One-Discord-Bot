import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const autoreactCommand: Command = {
  name: "autoreact",
  description: "Configure automatic reactions on messages containing specific triggers.",
  category: "Utility",
  permissionLevel: "ADMIN",
  usage: "autoreact <add | remove | show | rename | editemojis | reset> <trigger> [emojis]",
  examples: [
    "autoreact add hello 👍 🎉",
    "autoreact remove hello",
    "autoreact show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add" || action === "editemojis") {
      const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
      const emojis = ctx.args.slice(2);

      if (!trigger || emojis.length === 0) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoreact add <trigger> <emojis...>`", ctx.guild)] }, 5);
      }

      await prisma.autoReact.upsert({
        where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
        update: { emojis },
        create: { guildId: ctx.guild.id, trigger, emojis }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Auto reactions set for **${trigger}**: ${emojis.join(" ")}`, ctx.guild)] });
    }

    if (action === "remove") {
      const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
      if (!trigger) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoreact remove <trigger>`", ctx.guild)] }, 5);
      }

      try {
        await prisma.autoReact.delete({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Auto reaction for trigger **${trigger}** removed.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Auto reaction trigger not found.", ctx.guild)] }, 5);
      }
    }

    if (action === "rename") {
      const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
      const newTrigger = ctx.getStringOption("value", 2)?.toLowerCase();

      if (!trigger || !newTrigger) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoreact rename <old_trigger> <new_trigger>`", ctx.guild)] }, 5);
      }

      try {
        const entry = await prisma.autoReact.findUnique({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });

        if (!entry) {
          return ctx.reply({ embeds: [UniversalEmbed.error("Auto reaction trigger not found.", ctx.guild)] }, 5);
        }

        await prisma.autoReact.delete({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });

        await prisma.autoReact.create({
          data: {
            guildId: ctx.guild.id,
            trigger: newTrigger,
            emojis: entry.emojis
          }
        });

        return ctx.reply({ embeds: [UniversalEmbed.success(`Auto reaction trigger **${trigger}** renamed to **${newTrigger}**.`, ctx.guild)] });
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to rename. The new trigger may already exist.", ctx.guild)] }, 5);
      }
    }

    if (action === "show" || action === "list") {
      const list = await prisma.autoReact.findMany({ where: { guildId: ctx.guild.id } });
      const description = list.map(item => `• **${item.trigger}** → ${item.emojis.join(" ")}`).join("\n") || "No custom auto reactors configured.";

      const embed = UniversalEmbed.info("Auto Reactors List", ctx.guild)
        .setDescription(description);
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      await prisma.autoReact.deleteMany({ where: { guildId: ctx.guild.id } });
      return ctx.reply({ embeds: [UniversalEmbed.success("All auto reaction triggers cleared.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `autoreact [add|remove|show|rename|editemojis|reset] ...`", ctx.guild)] });
  }
};
