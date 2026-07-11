import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeAdd } from "./subcommands/autoresponder/add.js";
import { executeRemove } from "./subcommands/autoresponder/remove.js";
import { executeEditReply } from "./subcommands/autoresponder/editreply.js";
import { executeRename } from "./subcommands/autoresponder/rename.js";
import { executeShow } from "./subcommands/autoresponder/show.js";
import { executeReset } from "./subcommands/autoresponder/reset.js";

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

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Auto Responder Configuration Help", ctx.guild)
        .setDescription(
          `• \`autoresponder add <trigger> <response>\` - Add a trigger response.\n` +
          `• \`autoresponder remove <trigger>\` - Delete a trigger response.\n` +
          `• \`autoresponder editreply <trigger> <new_response>\` - Update response text.\n` +
          `• \`autoresponder rename <old_trigger> <new_trigger>\` - Change responder trigger phrase.\n` +
          `• \`autoresponder show\` - View active custom auto responders.\n` +
          `• \`autoresponder reset\` - Delete all custom auto responders.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    if (action === "add") {
      return executeAdd(ctx);
    }
    if (action === "remove") {
      return executeRemove(ctx);
    }
    if (action === "editreply") {
      return executeEditReply(ctx);
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

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`autoresponder\` to see valid options.`, ctx.guild)] }, 5);
  }
};
