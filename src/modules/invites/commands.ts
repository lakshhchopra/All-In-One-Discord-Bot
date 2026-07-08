import { CommandRegistry } from "../../commands/command.js";
import { invitesCommand } from "./commands/invites.js";
import { inviteLeaderboardCommand } from "./commands/inviteleaderboard.js";
import { inviteRewardCommand } from "./commands/invitereward.js";
import { inviteResetCommand } from "./commands/invitereset.js";

export { invitesCommand, inviteLeaderboardCommand, inviteRewardCommand, inviteResetCommand };

export function registerInvites() {
  CommandRegistry.register(invitesCommand);
  CommandRegistry.register(inviteLeaderboardCommand);
  CommandRegistry.register(inviteRewardCommand);
  CommandRegistry.register(inviteResetCommand);
}
