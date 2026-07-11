import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { EMOJIS } from "../../../config/emojis.js";
import { executeList } from "./subcommands/list.js";
import { executeShow } from "./subcommands/show.js";
import { executeDelete } from "./subcommands/delete.js";
import { executeRename } from "./subcommands/rename.js";
import { executeSave } from "./subcommands/save.js";
import { executeSend } from "./subcommands/send.js";
import { executeExport } from "./subcommands/export.js";
import { executeImport } from "./subcommands/import.js";
import { executeCreateOrEdit } from "./subcommands/createOrEdit.js";

// Helper to validate alphanumeric name
function isValidName(name: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(name);
}

export const embedCommand: Command = {
  name: "embed",
  description: "Manage and create custom embeds dynamically.",
  category: "Media",
  usage: "embed <create | edit | save | rename | send | post | export | import | list | show | delete> <name> [options]",
  examples: [
    "embed create rules",
    "embed send rules #general",
    "embed list",
    "embed show rules",
    "embed delete rules"
  ],
  execute: async (ctx) => {
    const subcommand = ctx.getStringOption("subcommand", 0)?.toLowerCase();
    const validSubcommands = ["create", "edit", "save", "rename", "send", "post", "export", "import", "list", "show", "delete"];

    if (!subcommand || !validSubcommands.includes(subcommand)) {
      const helpEmbed = new UniversalEmbed("info", undefined, ctx.guild)
        .setTitle(`${EMOJIS.media} Custom Embed System Help`)
        .setDescription(
          `Below is the list of all available subcommands in the custom embed system:\n\n` +
          `• \`embed list\` - List names of all saved custom embeds.\n` +
          `• \`embed show <name>\` - Display a preview of the saved embed with dynamic variables.\n` +
          `• \`embed create <name>\` - Start interactive modal-based editor to build a new embed.\n` +
          `• \`embed edit <name>\` - Modify an existing custom embed using modal forms.\n` +
          `• \`embed post/send <name> [channel]\` - Send the custom embed to a specific channel.\n` +
          `• \`embed save <name> [message_id]\` - Save an embed directly from an existing channel message.\n` +
          `• \`embed delete <name>\` - Delete a saved custom embed.\n` +
          `• \`embed rename <name> <new_name>\` - Rename a saved custom embed.\n` +
          `• \`embed export <name> <file/token>\` - Export embed configuration to a file or shareable token.\n` +
          `• \`embed import <name> [token]\` - Import embed configuration from a file attachment or token.`
        )
        .setFooter({ text: "Use these placeholders inside embeds: {user}, {server_name}, {server_icon}, etc." });
      return ctx.reply({ embeds: [helpEmbed] });
    }

    // list doesn't require a name parameter
    if (subcommand === "list") {
      return executeList(ctx);
    }

    const name = ctx.getStringOption("name", 1)?.toLowerCase();

    if (!name) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a name for the embed.", ctx.guild)] }, 5);
    }

    if (!isValidName(name)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Embed name must be a single alphanumeric word (hyphens/underscores allowed).", ctx.guild)] }, 5);
    }

    switch (subcommand) {
      case "show":
        return executeShow(ctx, name);
      case "delete":
        return executeDelete(ctx, name);
      case "rename":
        return executeRename(ctx, name);
      case "save":
        return executeSave(ctx, name);
      case "send":
      case "post":
        return executeSend(ctx, name);
      case "export":
        return executeExport(ctx, name);
      case "import":
        return executeImport(ctx, name);
      case "create":
        return executeCreateOrEdit(ctx, name, false);
      case "edit":
        return executeCreateOrEdit(ctx, name, true);
    }
  }
};
