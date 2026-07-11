import { CommandRegistry } from "../../commands/command.js";
import { embedCommand } from "./commands/embed.js";
import { variablesCommand } from "./commands/variables.js";

export {
  embedCommand,
  variablesCommand
};

export function registerExtras() {
  CommandRegistry.register(embedCommand);
  CommandRegistry.register(variablesCommand);
}
