import { CommandRegistry } from "../../commands/command.js";

// Basic
import { sayCommand } from "./commands/say.js";
import { stealCommand } from "./commands/steal.js";
import { nicknameCommand } from "./commands/nickname.js";
import { banCommand } from "./commands/ban.js";
import { fakebanCommand } from "./commands/fakeban.js";
import { softbanCommand } from "./commands/softban.js";
import { kickCommand } from "./commands/kick.js";
import { muteCommand } from "./commands/mute.js";
import { unmuteCommand } from "./commands/unmute.js";
import { unbanCommand } from "./commands/unban.js";
import { unbanallCommand } from "./commands/unbanall.js";
import { nukeCommand } from "./commands/nuke.js";
import { cloneCommand } from "./commands/clone.js";
import { hideCommand } from "./commands/hide.js";
import { hideallCommand } from "./commands/hideall.js";
import { unhideCommand } from "./commands/unhide.js";
import { unhideallCommand } from "./commands/unhideall.js";
import { lockCommand } from "./commands/lock.js";
import { lockallCommand } from "./commands/lockall.js";
import { unlockCommand } from "./commands/unlock.js";
import { unlockallCommand } from "./commands/unlockall.js";
import { slowmodeCommand } from "./commands/slowmode.js";
import { channelCommand } from "./commands/channel.js";

// Clear / Purge
import { clearCommand } from "./commands/clear.js";
import { clearbeatsCommand as clearbotsCommand } from "./commands/clearbots.js";
import { clearimageCommand } from "./commands/clearimage.js";
import { clearreactionsCommand } from "./commands/clearreactions.js";
import { clearcontainCommand } from "./commands/clearcontain.js";
import { clearembedCommand } from "./commands/clearembed.js";

// Role
import { roleiconCommand } from "./commands/roleicon.js";
import { rolealiasCommand } from "./commands/rolealias.js";
import { roleallCommand } from "./commands/roleall.js";
import { roleaddCommand } from "./commands/roleadd.js";
import { roleremoveCommand } from "./commands/roleremove.js";
import { rolecreateCommand } from "./commands/rolecreate.js";
import { rroleCommand } from "./commands/rrole.js";

// Quarantine
import { quarantineCommand } from "./commands/quarantine.js";
import { quarantineaddCommand } from "./commands/quarantineadd.js";
import { quarantineremoveCommand } from "./commands/quarantineremove.js";
import { quarantinesetupCommand } from "./commands/quarantinesetup.js";
import { quarantineshowCommand } from "./commands/quarantineshow.js";
import { quarantineresetCommand } from "./commands/quarantinereset.js";

// Voice (single-member)
import { voiceCommand } from "./commands/voice.js";
import { voicemuteCommand } from "./commands/voicemute.js";
import { voiceunmuteCommand } from "./commands/voiceunmute.js";
import { voicedeafenCommand } from "./commands/voicedeafen.js";
import { voiceundeafenCommand } from "./commands/voiceundeafen.js";
import { voicekickCommand } from "./commands/voicekick.js";
import { voicepullCommand } from "./commands/voicepull.js";
import { voicemoveCommand } from "./commands/voicemove.js";
// Voice (all / channel-wide)
import { voicemuteallCommand } from "./commands/voicemuteall.js";
import { voiceunmuteallCommand } from "./commands/voiceunmuteall.js";
import { voicedeafenallCommand } from "./commands/voicedeafenall.js";
import { voiceundeafenallCommand } from "./commands/voiceundeafenall.js";
import { voicekickallCommand } from "./commands/voicekickall.js";
import { voicemoveallCommand } from "./commands/voicemoveall.js";
import { voicepullallCommand } from "./commands/voicepullall.js";
import { voiceprivateCommand } from "./commands/voiceprivate.js";
import { voiceunprivateCommand } from "./commands/voiceunprivate.js";
import { voicelockCommand } from "./commands/voicelock.js";
import { voiceunlockCommand } from "./commands/voiceunlock.js";

// VC Roles
import { vcroleCommand } from "./commands/vcrole.js";
import { vcrolesetCommand } from "./commands/vcroleset.js";
import { vcroleremoveCommand } from "./commands/vcroleremove.js";
import { vcroleenableCommand } from "./commands/vcroleenable.js";
import { vcroledisableCommand } from "./commands/vcroledisable.js";
import { vcroleShowCommand } from "./commands/vcroleshow.js";
import { vcrolereset } from "./commands/vcrolereset.js";

export function registerModeration() {
  // Basic
  CommandRegistry.register(sayCommand);
  CommandRegistry.register(stealCommand);
  CommandRegistry.register(nicknameCommand);
  CommandRegistry.register(banCommand);
  CommandRegistry.register(fakebanCommand);
  CommandRegistry.register(softbanCommand);
  CommandRegistry.register(kickCommand);
  CommandRegistry.register(muteCommand);
  CommandRegistry.register(unmuteCommand);
  CommandRegistry.register(unbanCommand);
  CommandRegistry.register(unbanallCommand);
  CommandRegistry.register(nukeCommand);
  CommandRegistry.register(cloneCommand);
  CommandRegistry.register(hideCommand);
  CommandRegistry.register(hideallCommand);
  CommandRegistry.register(unhideCommand);
  CommandRegistry.register(unhideallCommand);
  CommandRegistry.register(lockCommand);
  CommandRegistry.register(lockallCommand);
  CommandRegistry.register(unlockCommand);
  CommandRegistry.register(unlockallCommand);
  CommandRegistry.register(slowmodeCommand);
  CommandRegistry.register(channelCommand);

  // Clear / Purge
  CommandRegistry.register(clearCommand);
  CommandRegistry.register(clearbotsCommand);
  CommandRegistry.register(clearimageCommand);
  CommandRegistry.register(clearreactionsCommand);
  CommandRegistry.register(clearcontainCommand);
  CommandRegistry.register(clearembedCommand);

  // Role
  CommandRegistry.register(roleiconCommand);
  CommandRegistry.register(rolealiasCommand);
  CommandRegistry.register(roleallCommand);
  CommandRegistry.register(roleaddCommand);
  CommandRegistry.register(roleremoveCommand);
  CommandRegistry.register(rolecreateCommand);
  CommandRegistry.register(rroleCommand);

  // Quarantine
  CommandRegistry.register(quarantineCommand);
  CommandRegistry.register(quarantineaddCommand);
  CommandRegistry.register(quarantineremoveCommand);
  CommandRegistry.register(quarantinesetupCommand);
  CommandRegistry.register(quarantineshowCommand);
  CommandRegistry.register(quarantineresetCommand);

  // Voice (single)
  CommandRegistry.register(voiceCommand);
  CommandRegistry.register(voicemuteCommand);
  CommandRegistry.register(voiceunmuteCommand);
  CommandRegistry.register(voicedeafenCommand);
  CommandRegistry.register(voiceundeafenCommand);
  CommandRegistry.register(voicekickCommand);
  CommandRegistry.register(voicepullCommand);
  CommandRegistry.register(voicemoveCommand);
  // Voice (all)
  CommandRegistry.register(voicemuteallCommand);
  CommandRegistry.register(voiceunmuteallCommand);
  CommandRegistry.register(voicedeafenallCommand);
  CommandRegistry.register(voiceundeafenallCommand);
  CommandRegistry.register(voicekickallCommand);
  CommandRegistry.register(voicemoveallCommand);
  CommandRegistry.register(voicepullallCommand);
  CommandRegistry.register(voiceprivateCommand);
  CommandRegistry.register(voiceunprivateCommand);
  CommandRegistry.register(voicelockCommand);
  CommandRegistry.register(voiceunlockCommand);

  // VC Roles
  CommandRegistry.register(vcroleCommand);
  CommandRegistry.register(vcrolesetCommand);
  CommandRegistry.register(vcroleremoveCommand);
  CommandRegistry.register(vcroleenableCommand);
  CommandRegistry.register(vcroledisableCommand);
  CommandRegistry.register(vcroleShowCommand);
  CommandRegistry.register(vcrolereset);
}
