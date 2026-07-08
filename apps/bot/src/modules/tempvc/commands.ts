import { CommandRegistry } from "../../commands/command.js";
import { setupGeneratorCommand } from "./commands/setupgenerator.js";
import { tempvcCommand } from "./commands/tempvc.js";

export { setupGeneratorCommand, tempvcCommand };

export function registerTempVc() {
  CommandRegistry.register(setupGeneratorCommand);
  CommandRegistry.register(tempvcCommand);
}
