import { CommandRegistry } from "../../commands/command.js";
import { antinukeCommand } from "./commands/antinuke.js";
import { whitelistCommand } from "./commands/whitelist.js";
import { extraownerCommand } from "./commands/extraowner.js";
import { automodCommand } from "./commands/automod.js";
import { blwordCommand } from "./commands/blword.js";
import { mainroleCommand } from "./commands/mainrole.js";
import { panicmodeCommand } from "./commands/panicmode.js";
import { trustedCommand } from "./commands/trusted.js";
import { ignoreCommand } from "./commands/ignore.js";

export {
  antinukeCommand,
  whitelistCommand,
  extraownerCommand,
  automodCommand,
  blwordCommand,
  mainroleCommand,
  panicmodeCommand,
  trustedCommand,
  ignoreCommand
};

export function registerSecurity() {
  CommandRegistry.register(antinukeCommand);
  CommandRegistry.register(whitelistCommand);
  CommandRegistry.register(extraownerCommand);
  CommandRegistry.register(automodCommand);
  CommandRegistry.register(blwordCommand);
  CommandRegistry.register(mainroleCommand);
  CommandRegistry.register(panicmodeCommand);
  CommandRegistry.register(trustedCommand);
  CommandRegistry.register(ignoreCommand);
}
