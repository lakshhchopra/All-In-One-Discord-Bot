import { CommandRegistry } from "../../commands/command.js";
import { embedCommand } from "./commands/embed.js";
import { variablesCommand } from "./commands/variables.js";
import { autoresponderCommand } from "./commands/autoresponder.js";
import { reactionroleCommand } from "./commands/reactionrole.js";
import { autoreactCommand } from "./commands/autoreact.js";
import { stickyCommand } from "./commands/sticky.js";

export {
  embedCommand,
  variablesCommand,
  autoresponderCommand,
  reactionroleCommand,
  autoreactCommand,
  stickyCommand
};

export function registerExtras() {
  CommandRegistry.register(embedCommand);
  CommandRegistry.register(variablesCommand);
  CommandRegistry.register(autoresponderCommand);
  CommandRegistry.register(reactionroleCommand);
  CommandRegistry.register(autoreactCommand);
  CommandRegistry.register(stickyCommand);
}
