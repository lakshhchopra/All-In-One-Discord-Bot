import { CommandRegistry } from "../../commands/command.js";
import { setPrefixCommand } from "./commands/setprefix.js";
import { configCommand } from "./commands/config.js";
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

// Re-export all helpers so interactionCreate.ts and other files can import from this path
export {
  setPrefixCommand,
  configCommand,
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

export function registerConfiguration() {
  CommandRegistry.register(setPrefixCommand);
  CommandRegistry.register(configCommand);
  CommandRegistry.register(helpCommand);
}
