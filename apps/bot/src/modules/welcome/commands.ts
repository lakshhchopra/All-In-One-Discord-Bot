import { CommandRegistry } from "../../commands/command.js";
import { greetCommand } from "./commands/greet.js";
import { leavemsgCommand } from "./commands/leavemsg.js";
import { boostgreetCommand } from "./commands/boostgreet.js";
import { autoroleCommand } from "./commands/autorole.js";

export { greetCommand, leavemsgCommand, boostgreetCommand, autoroleCommand };

export function registerWelcome() {
  CommandRegistry.register(greetCommand);
  CommandRegistry.register(leavemsgCommand);
  CommandRegistry.register(boostgreetCommand);
  CommandRegistry.register(autoroleCommand);
}
