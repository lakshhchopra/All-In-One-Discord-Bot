import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const autoresponderCommand: Command = {
  name: "autoresponder",
  description: "Configure and manage custom auto responders.",
  category: "Utility",
  permissionLevel: "ADMIN",
  usage: "autoresponder <add | remove | show | editreply | rename | reset> <trigger> [value]",
  examples: [
    "autoresponder add hello Hi there!",
    "autoresponder remove hello",
    "autoresponder editreply hello How can I help?",
    "autoresponder rename hello hi",
    "autoresponder show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
      const response = ctx.args.slice(2).join(" ");

      if (!trigger || !response) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder add <trigger> <response>`", ctx.guild)] }, 5);
      }

      await prisma.autoResponder.upsert({
        where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
        update: { response },
        create: { guildId: ctx.guild.id, trigger, response }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder added for trigger **${trigger}**.`, ctx.guild)] });
    }

    if (action === "remove") {
      const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
      if (!trigger) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder remove <trigger>`", ctx.guild)] }, 5);
      }

      try {
        await prisma.autoResponder.delete({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder for trigger **${trigger}** removed.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
      }
    }

    if (action === "editreply") {
      const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
      const response = ctx.args.slice(2).join(" ");

      if (!trigger || !response) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder editreply <trigger> <new_response>`", ctx.guild)] }, 5);
      }

      try {
        await prisma.autoResponder.update({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
          data: { response }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder response updated for trigger **${trigger}**.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
      }
    }

    if (action === "rename") {
      const trigger = ctx.getStringOption("trigger", 1)?.toLowerCase();
      const newTrigger = ctx.getStringOption("value", 2)?.toLowerCase();

      if (!trigger || !newTrigger) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder rename <old_trigger> <new_trigger>`", ctx.guild)] }, 5);
      }

      try {
        const entry = await prisma.autoResponder.findUnique({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });

        if (!entry) {
          return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
        }

        // Delete old and create new to avoid key conflicts
        await prisma.autoResponder.delete({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });

        await prisma.autoResponder.create({
          data: {
            guildId: ctx.guild.id,
            trigger: newTrigger,
            response: entry.response,
            matchType: entry.matchType
          }
        });

        return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder trigger **${trigger}** renamed to **${newTrigger}**.`, ctx.guild)] });
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to rename auto responder. The new trigger may already exist.", ctx.guild)] }, 5);
      }
    }

    if (action === "show" || action === "list") {
      const list = await prisma.autoResponder.findMany({ where: { guildId: ctx.guild.id } });
      const respondersList = list.map(item => `• **${item.trigger}** → ${item.response}`).join("\n") || "No custom auto responders configured.";

      const embed = UniversalEmbed.info("Auto Responders List", ctx.guild)
        .setDescription(respondersList);
      return ctx.reply({ embeds: [embed] });
    }

    if (action === "reset") {
      await prisma.autoResponder.deleteMany({ where: { guildId: ctx.guild.id } });
      return ctx.reply({ embeds: [UniversalEmbed.success("All auto responders have been cleared.", ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `autoresponder [add | remove | show | editreply | rename | reset] ...`", ctx.guild)] });
  }
};
