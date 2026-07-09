import { CommandRegistry } from "../../commands/command.js";
import { gstartCommand } from "./commands/gstart.js";
import { gendCommand } from "./commands/gend.js";
import { grerollCommand } from "./commands/greroll.js";
import { gpauseCommand } from "./commands/gpause.js";
import { gresumeCommand } from "./commands/gresume.js";
import { gparticipantsCommand } from "./commands/gparticipants.js";

export {
  gstartCommand,
  gendCommand,
  grerollCommand,
  gpauseCommand,
  gresumeCommand,
  gparticipantsCommand
};

export function registerGiveaway() {
  CommandRegistry.register(gstartCommand);
  CommandRegistry.register(gendCommand);
  CommandRegistry.register(grerollCommand);
  CommandRegistry.register(gpauseCommand);
  CommandRegistry.register(gresumeCommand);
  CommandRegistry.register(gparticipantsCommand);
}
