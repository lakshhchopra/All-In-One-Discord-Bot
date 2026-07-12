import { CommandRegistry } from "../../commands/command.js";
import { addOwnerCommand } from "./commands/addowner.js";
import { botInviteCommand } from "./commands/botinvite.js";
import { reloadCommand } from "./commands/reload.js";
import { serverListCommand } from "./commands/serverlist.js";

export function registerDeveloper() {
  CommandRegistry.register(addOwnerCommand);
  CommandRegistry.register(botInviteCommand);
  CommandRegistry.register(reloadCommand);
  CommandRegistry.register(serverListCommand);
}
