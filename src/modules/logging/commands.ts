import { CommandRegistry } from "../../commands/command.js";
import { setLogChannelCommand } from "./commands/setlogchannel.js";
import { logCommand } from "./commands/log.js";

export { setLogChannelCommand, logCommand };

export function registerLogging() {
  CommandRegistry.register(setLogChannelCommand);
  CommandRegistry.register(logCommand);
}
