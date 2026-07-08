import { CommandRegistry } from "../../commands/command.js";
import { gstartCommand } from "./commands/gstart.js";
import { gendCommand } from "./commands/gend.js";
import { grerollCommand } from "./commands/greroll.js";

export { gstartCommand, gendCommand, grerollCommand };

export function registerGiveaway() {
  CommandRegistry.register(gstartCommand);
  CommandRegistry.register(gendCommand);
  CommandRegistry.register(grerollCommand);
}
