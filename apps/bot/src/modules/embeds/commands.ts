import { CommandRegistry } from "../../commands/command.js";
import { embedCommand } from "./commands/embed.js";
import { variablesCommand } from "./commands/variables.js";
import { autoresponderCommand } from "./commands/autoresponder.js";
import { reactionroleCommand } from "./commands/reactionrole.js";
import { listCommand } from "./commands/list.js";

export { embedCommand, variablesCommand, autoresponderCommand, reactionroleCommand, listCommand };

export function registerExtras() {
  CommandRegistry.register(embedCommand);
  CommandRegistry.register(variablesCommand);
  CommandRegistry.register(autoresponderCommand);
  CommandRegistry.register(reactionroleCommand);
  CommandRegistry.register(listCommand);
}
