import { CommandRegistry } from "../../commands/command.js";
import { tempvcCommand } from "./commands/tempvc.js";

export { tempvcCommand };

export function registerTempVc() {
  CommandRegistry.register(tempvcCommand);
}
