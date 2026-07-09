import { CommandRegistry } from "../../commands/command.js";
import { countingCommand } from "./commands/counting.js";
import { lbCommand } from "./commands/lb.js";
import { countCommand } from "./commands/count.js";
import { shipCommand } from "./commands/ship.js";

export { countingCommand, lbCommand, countCommand, shipCommand };

export function registerGames() {
  CommandRegistry.register(countingCommand);
  CommandRegistry.register(lbCommand);
  CommandRegistry.register(countCommand);
  CommandRegistry.register(shipCommand);
}
