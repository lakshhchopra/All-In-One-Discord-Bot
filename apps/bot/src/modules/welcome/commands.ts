import { CommandRegistry } from "../../commands/command.js";
import { setGreetCommand } from "./commands/setgreet.js";
import { setBoostCommand } from "./commands/setboost.js";
import { autoroleCommand } from "./commands/autorole.js";
import { testGreetCommand } from "./commands/testgreet.js";
import { testBoostCommand } from "./commands/testboost.js";

export { setGreetCommand, setBoostCommand, autoroleCommand, testGreetCommand, testBoostCommand };

export function registerWelcome() {
  CommandRegistry.register(setGreetCommand);
  CommandRegistry.register(setBoostCommand);
  CommandRegistry.register(autoroleCommand);
  CommandRegistry.register(testGreetCommand);
  CommandRegistry.register(testBoostCommand);
}
