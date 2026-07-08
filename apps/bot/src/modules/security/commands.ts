import { CommandRegistry } from "../../commands/command.js";
import { antinukeCommand } from "./commands/antinuke.js";
import { whitelistCommand } from "./commands/whitelist.js";
import { extraownerCommand } from "./commands/extraowner.js";

export { antinukeCommand, whitelistCommand, extraownerCommand };

export function registerSecurity() {
  CommandRegistry.register(antinukeCommand);
  CommandRegistry.register(whitelistCommand);
  CommandRegistry.register(extraownerCommand);
}
