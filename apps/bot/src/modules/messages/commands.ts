import { CommandRegistry } from "../../commands/command.js";
import { messagesCommand } from "./commands/messages.js";
import { messagesLeaderboardCommand } from "./commands/messagesleaderboard.js";
import { dailyMessagesCommand } from "./commands/dailymessages.js";
import { messagesResetCommand } from "./commands/messagesreset.js";

export { messagesCommand, messagesLeaderboardCommand, dailyMessagesCommand, messagesResetCommand };

export function registerMessages() {
  CommandRegistry.register(messagesCommand);
  CommandRegistry.register(messagesLeaderboardCommand);
  CommandRegistry.register(dailyMessagesCommand);
  CommandRegistry.register(messagesResetCommand);
}
