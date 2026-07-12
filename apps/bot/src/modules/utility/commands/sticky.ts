import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeAdd } from "./subcommands/sticky/add.js";
import { executeRemove } from "./subcommands/sticky/remove.js";
import { executeShow } from "./subcommands/sticky/show.js";
import { executeBump } from "./subcommands/sticky/bump.js";

export const stickyCommand: Command = {
  name: "sticky",
  description: "Configure sticky messages that stick to the bottom of text channels.",
  category: "Utility",
  permissionLevel: "ADMIN",
  usage: "sticky <add | remove | show | bump | reset | channel> [message]",
  examples: [
    "sticky add Read the rules before chatting!",
    "sticky show",
    "sticky remove"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Sticky Message Configuration Help", ctx.guild)
        .setDescription(
          `• \`sticky add <message>\` - Create a sticky post in this channel.\n` +
          `• \`sticky remove\` - Stop the sticky message in this channel.\n` +
          `• \`sticky show\` - Preview current channel sticky config.\n` +
          `• \`sticky bump\` - Relocate sticky message to the bottom.\n` +
          `• \`sticky channel\` - Toggle or change sticky message (same as add).\n` +
          `• \`sticky channel remove\` - Stop the sticky message (same as remove).`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    if (action === "add" || action === "channel" || action === "channel add") {
      return executeAdd(ctx);
    }
    if (action === "remove" || action === "reset" || action === "channel remove") {
      return executeRemove(ctx);
    }
    if (action === "show" || action === "list") {
      return executeShow(ctx);
    }
    if (action === "bump") {
      return executeBump(ctx);
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`sticky\` to see valid options.`, ctx.guild)] }, 5);
  }
};
