import { CommandRegistry } from "../../commands/command.js";
import { invitesCommand } from "./commands/invites.js";
import { inviteLeaderboardCommand } from "./commands/inviteleaderboard.js";
import { inviteRewardCommand } from "./commands/invitereward.js";
import { messageCommand } from "./commands/message.js";
import { messagesLeaderboardCommand } from "./commands/messagesleaderboard.js";
import { messagesResetCommand } from "./commands/messagesreset.js";

export {
  invitesCommand,
  inviteLeaderboardCommand,
  inviteRewardCommand,
  messageCommand,
  messagesLeaderboardCommand,
  messagesResetCommand
};

export function registerInvitesMessages() {
  CommandRegistry.register(invitesCommand);
  CommandRegistry.register(inviteLeaderboardCommand);
  CommandRegistry.register(inviteRewardCommand);
  CommandRegistry.register(messageCommand);
  CommandRegistry.register(messagesLeaderboardCommand);
  CommandRegistry.register(messagesResetCommand);
}
