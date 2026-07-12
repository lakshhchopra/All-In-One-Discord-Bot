import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeAdd } from "./subcommands/autoreact/add.js";
import { executeRemove } from "./subcommands/autoreact/remove.js";
import { executeRename } from "./subcommands/autoreact/rename.js";
import { executeShow } from "./subcommands/autoreact/show.js";
import { executeReset } from "./subcommands/autoreact/reset.js";

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

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Auto React Configuration Help", ctx.guild)
        .setDescription(
          `• \`autoreact add <trigger> <emojis...>\` - Add emojis that react to a word.\n` +
          `• \`autoreact remove <trigger>\` - Delete auto reaction settings.\n` +
          `• \`autoreact editemojis <trigger> <emojis...>\` - Update reacting emojis.\n` +
          `• \`autoreact rename <old_trigger> <new_trigger>\` - Change reacting trigger word.\n` +
          `• \`autoreact show\` - View current active auto react settings.\n` +
          `• \`autoreact reset\` - Clear all auto reaction triggers.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    if (action === "add" || action === "editemojis") {
      return executeAdd(ctx);
    }
    if (action === "remove") {
      return executeRemove(ctx);
    }
    if (action === "rename") {
      return executeRename(ctx);
    }
    if (action === "show" || action === "list") {
      return executeShow(ctx);
    }
    if (action === "reset") {
      return executeReset(ctx);
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`autoreact\` to see valid options.`, ctx.guild)] }, 5);
  }
};
