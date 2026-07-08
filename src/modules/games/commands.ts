import { CommandRegistry } from "../../commands/command.js";
import { setCountChannelCommand } from "./commands/setcountchannel.js";
import { lbCountCommand } from "./commands/lbcount.js";
import { shipCommand } from "./commands/ship.js";

export { setCountChannelCommand, lbCountCommand, shipCommand };

export function registerGames() {
  CommandRegistry.register(setCountChannelCommand);
  CommandRegistry.register(lbCountCommand);
  CommandRegistry.register(shipCommand);
}
