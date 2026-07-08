import { CommandRegistry } from "../../commands/command.js";
import { vcmuteCommand } from "./commands/vcmute.js";
import { vcunmuteCommand } from "./commands/vcunmute.js";
import { vckickCommand } from "./commands/vckick.js";
import { vcdeafenCommand } from "./commands/vcdeafen.js";
import { vcundeafenCommand } from "./commands/vcundeafen.js";
import { vclistCommand } from "./commands/vclist.js";
import { vcroleCommand } from "./commands/vcrole.js";

export { vcmuteCommand, vcunmuteCommand, vckickCommand, vcdeafenCommand, vcundeafenCommand, vclistCommand, vcroleCommand };

export function registerVoiceMod() {
  CommandRegistry.register(vcmuteCommand);
  CommandRegistry.register(vcunmuteCommand);
  CommandRegistry.register(vckickCommand);
  CommandRegistry.register(vcdeafenCommand);
  CommandRegistry.register(vcundeafenCommand);
  CommandRegistry.register(vclistCommand);
  CommandRegistry.register(vcroleCommand);
}
