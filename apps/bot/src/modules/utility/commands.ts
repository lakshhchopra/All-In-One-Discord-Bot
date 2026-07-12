import { CommandRegistry } from "../../commands/command.js";
import { autoresponderCommand } from "./commands/autoresponder.js";
import { reactionroleCommand } from "./commands/reactionrole.js";
import { autoreactCommand } from "./commands/autoreact.js";
import { stickyCommand } from "./commands/sticky.js";

export { autoresponderCommand, reactionroleCommand, autoreactCommand, stickyCommand };

export function registerUtility() {
  CommandRegistry.register(autoresponderCommand);
  CommandRegistry.register(reactionroleCommand);
  CommandRegistry.register(autoreactCommand);
  CommandRegistry.register(stickyCommand);
}
