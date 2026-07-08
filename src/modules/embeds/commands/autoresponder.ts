import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { prisma } from "../../../services/db.js";

export const autoresponderCommand: Command = {
  name: "autoresponder",
  description: "Manage auto responders.",
  category: "Extras",
  permissionLevel: "ADMIN",
  usage: "autoresponder <add | remove | list> <trigger> [response]",
  examples: [
    "autoresponder add hello Hi there!",
    "autoresponder remove hello",
    "autoresponder list"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (action === "add") {
      const trigger = ctx.getStringOption("trigger", 1);
      const response = ctx.args.slice(2).join(" ");

      if (!trigger || !response) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder add <trigger> <response>`", ctx.guild)] }, 5);
      }

      await prisma.autoResponder.upsert({
        where: { guildId_trigger: { guildId: ctx.guild.id, trigger } },
        update: { response },
        create: { guildId: ctx.guild.id, trigger, response }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder added for \`${trigger}\``, ctx.guild)] });
    }

    if (action === "remove") {
      const trigger = ctx.getStringOption("trigger", 1);
      if (!trigger) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `autoresponder remove <trigger>`", ctx.guild)] }, 5);

      try {
        await prisma.autoResponder.delete({
          where: { guildId_trigger: { guildId: ctx.guild.id, trigger } }
        });
        return ctx.reply({ embeds: [UniversalEmbed.success(`Auto responder for \`${trigger}\` removed.`, ctx.guild)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("Auto responder trigger not found.", ctx.guild)] }, 5);
      }
    }

    if (action === "list") {
      const list = await prisma.autoResponder.findMany({ where: { guildId: ctx.guild.id } });
      const respondersList = list.map(item => `• **${item.trigger}** → ${item.response}`).join("\n") || "No custom auto responders configured.";

      const embed = UniversalEmbed.info("Auto Responders List", ctx.guild)
        .setDescription(respondersList);
      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `autoresponder [add|remove|list] ...`", ctx.guild)] });
  }
};
