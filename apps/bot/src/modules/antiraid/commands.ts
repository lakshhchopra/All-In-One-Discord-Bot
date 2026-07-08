import { CommandRegistry } from "../../commands/command.js";
import { antiraidCommand } from "./commands/antiraid.js";
import { raidlockCommand } from "./commands/raidlock.js";
import { unraidlockCommand } from "./commands/unraidlock.js";

export { antiraidCommand, raidlockCommand, unraidlockCommand };

export function registerAntiRaid() {
  CommandRegistry.register(antiraidCommand);
  CommandRegistry.register(raidlockCommand);
  CommandRegistry.register(unraidlockCommand);
}
