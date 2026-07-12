import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

// Import all subcommands
import { roleaddCommand } from "./role/roleadd.js";
import { roleremoveCommand } from "./role/roleremove.js";
import { rolecreateCommand } from "./role/rolecreate.js";
import { roledeleteCommand } from "./role/roledelete.js";
import { rolerenameCommand } from "./role/rolerename.js";
import { rolecolourCommand } from "./role/rolecolour.js";
import { rolebotsCommand } from "./role/rolebots.js";
import { rolehumansCommand } from "./role/rolehumans.js";
import { roleallCommand } from "./role/roleall.js";
import { roleiconCommand } from "./role/roleicon.js";
import { rolealiasCommand } from "./role/rolealias.js";

// Do NOT include rrole here if it's meant to be a standalone reaction role command.
// We will register rrole separately in commands.ts.

const subcommands = new Map<string, Command>();
[
  roleaddCommand,
  roleremoveCommand,
  rolecreateCommand,
  roledeleteCommand,
  rolerenameCommand,
  rolecolourCommand,
  rolebotsCommand,
  rolehumansCommand,
  roleallCommand,
  roleiconCommand,
  rolealiasCommand
].forEach(cmd => {
  // Use the command name without 'role' prefix as the subcommand name
  // e.g. 'roleadd' -> 'add'
  const subName = cmd.name.startsWith('role') ? cmd.name.slice(4) : cmd.name;
  subcommands.set(subName, cmd);
});

export const roleCommand: Command = {
  name: "role",
  description: "Manage server roles: add, remove, create, delete, rename, colour, and mass-assign.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "role <add|remove|create|delete|rename|colour|bots|humans|all> <options>",
  examples: [
    "role add @member @Admin",
    "role remove @member @Muted",
    "role create VIP #FFD700",
    "role delete @OldRole",
    "role rename @OldRole NewName",
    "role colour @VIP #FF5733",
    "role bots @Bot-Role",
    "role humans @Member",
    "role all @Everyone"
  ],
  execute: async (ctx) => {
    const sub = ctx.getStringOption("action", 0)?.toLowerCase();
    
    if (!sub || !subcommands.has(sub)) {
      // Show help menu
      const embed = new UniversalEmbed("info")
        .setTitle("🛡️ Role Management")
        .setDescription("Use `role <subcommand>` to manage roles.")
        .addFields(
          { name: "Single User", value: "`add`, `remove`" },
          { name: "Role Editing", value: "`create`, `delete`, `rename`, `colour`, `icon`" },
          { name: "Mass Assign", value: "`bots`, `humans`, `all`" },
          { name: "Aliases", value: "`alias`" }
        )
        .setFooter({ text: "Use -help role <subcommand> for details" });
      
      return ctx.reply({ embeds: [embed] });
    }

    const cmd = subcommands.get(sub)!;
    // Strip the 'action' (subcommand) from args so the subcommand gets pure args
    // Example: '-role add @user @role' -> args in ctx are ['add', '@user', '@role']
    // We want to pass ['@user', '@role'] to the subcommand.
    const subCtx = Object.assign(Object.create(Object.getPrototypeOf(ctx)), ctx);
    subCtx.args = ctx.args.slice(1);

    try {
      await cmd.execute(subCtx);
    } catch (err: any) {
      console.error(`[Role] Subcommand ${sub} failed:`, err);
      return ctx.reply({ embeds: [UniversalEmbed.error("An error occurred executing this subcommand.", ctx.guild)] }, 5);
    }
  }
};
