import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeAdd } from "./subcommands/reactionrole/add.js";
import { executeRemove } from "./subcommands/reactionrole/remove.js";
import { executeShow } from "./subcommands/reactionrole/show.js";
import { executeClear } from "./subcommands/reactionrole/clear.js";
import { executeInfo } from "./subcommands/reactionrole/info.js";

export const reactionroleCommand: Command = {
  name: "reactionrole",
  description: "Configure and manage reaction roles.",
  category: "Utility",
  permissionLevel: "ADMIN",
  usage: "reactionrole <add | remove | show | clear | addmany | format | info | edit | clone | maxroles> [messageId] [emoji] [role]",
  examples: [
    "reactionrole add 1135816865055256688 :smile: @Member",
    "reactionrole remove 1135816865055256688 :smile: @Member",
    "reactionrole show"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Reaction Role Configuration Help", ctx.guild)
        .setDescription(
          `• \`reactionrole add <messageId> <emoji> <role>\` - Bind a role to a message emoji reaction.\n` +
          `• \`reactionrole remove <messageId> <emoji> <role>\` - Remove reaction role mapping.\n` +
          `• \`reactionrole show\` - Display active reaction roles configuration.\n` +
          `• \`reactionrole clear\` - Reset all reaction role bindings.\n` +
          `• \`reactionrole info\` - Show system status and maximum roles details.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    if (action === "add") {
      return executeAdd(ctx);
    }
    if (action === "remove") {
      return executeRemove(ctx);
    }
    if (action === "show" || action === "list") {
      return executeShow(ctx);
    }
    if (action === "clear" || action === "reset") {
      return executeClear(ctx);
    }
    if (action === "maxroles" || action === "info" || action === "format" || action === "edit" || action === "clone" || action === "addmany") {
      return executeInfo(ctx);
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`reactionrole\` to see valid options.`, ctx.guild)] }, 5);
  }
};
