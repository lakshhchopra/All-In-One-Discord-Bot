import { CommandRegistry } from "../../commands/command.js";
import { infoCommand } from "./commands/info.js";
import { prefixCommand } from "./commands/prefix.js";
import { noprefixCommand } from "./commands/noprefix.js";
import { configCommand } from "./commands/config.js";
import { uptimeCommand } from "./commands/uptime.js";
import {
  helpCommand,
  getHomeEmbed,
  getHelpComponents,
  getCategoryEmbed,
  getAllCommandsEmbed,
  getCommandsForOption,
  getCommandModule,
  resolveCategory,
  COMMAND_USAGES
} from "./commands/help.js";

export {
  infoCommand,
  prefixCommand,
  noprefixCommand,
  configCommand,
  uptimeCommand,
  helpCommand,
  getHomeEmbed,
  getHelpComponents,
  getCategoryEmbed,
  getAllCommandsEmbed,
  getCommandsForOption,
  getCommandModule,
  resolveCategory,
  COMMAND_USAGES
};

export function registerBotInfo() {
  CommandRegistry.register(infoCommand);
  CommandRegistry.register(prefixCommand);
  CommandRegistry.register(noprefixCommand);
  CommandRegistry.register(configCommand);
  CommandRegistry.register(uptimeCommand);
  CommandRegistry.register(helpCommand);
}
