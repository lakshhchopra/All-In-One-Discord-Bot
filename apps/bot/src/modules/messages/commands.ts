import { CommandRegistry } from "../../commands/command.js";
import { messageCommand } from "./commands/message.js";
import { messagesLeaderboardCommand } from "./commands/messagesleaderboard.js";
import { messagesResetCommand } from "./commands/messagesreset.js";

export { messageCommand, messagesLeaderboardCommand, messagesResetCommand };

export function registerMessages() {
  CommandRegistry.register(messageCommand);
  CommandRegistry.register(messagesLeaderboardCommand);
  CommandRegistry.register(messagesResetCommand);
}
