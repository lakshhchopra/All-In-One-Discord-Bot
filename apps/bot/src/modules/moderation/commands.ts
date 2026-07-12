import { CommandRegistry } from "../../commands/command.js";

// Basic
import { sayCommand } from "./commands/basic/say.js";
import { stealCommand } from "./commands/basic/steal.js";
import { nicknameCommand } from "./commands/basic/nickname.js";
import { banCommand } from "./commands/basic/ban.js";
import { fakebanCommand } from "./commands/basic/fakeban.js";
import { softbanCommand } from "./commands/basic/softban.js";
import { kickCommand } from "./commands/basic/kick.js";
import { muteCommand } from "./commands/basic/mute.js";
import { unmuteCommand } from "./commands/basic/unmute.js";
import { unbanCommand } from "./commands/basic/unban.js";
import { unbanallCommand } from "./commands/basic/unbanall.js";
import { nukeCommand } from "./commands/basic/nuke.js";
import { cloneCommand } from "./commands/basic/clone.js";
import { hideCommand } from "./commands/basic/hide.js";
import { hideallCommand } from "./commands/basic/hideall.js";
import { unhideCommand } from "./commands/basic/unhide.js";
import { unhideallCommand } from "./commands/basic/unhideall.js";
import { lockCommand } from "./commands/basic/lock.js";
import { lockallCommand } from "./commands/basic/lockall.js";
import { unlockCommand } from "./commands/basic/unlock.js";
import { unlockallCommand } from "./commands/basic/unlockall.js";
import { slowmodeCommand } from "./commands/basic/slowmode.js";
import { channelCommand } from "./commands/basic/channel.js";

// Clear / Purge
import { clearCommand } from "./commands/purge/clear.js";
import { clearbeatsCommand as clearbotsCommand } from "./commands/purge/clearbots.js";
import { clearimageCommand } from "./commands/purge/clearimage.js";
import { clearreactionsCommand } from "./commands/purge/clearreactions.js";
import { clearcontainCommand } from "./commands/purge/clearcontain.js";
import { clearembedCommand } from "./commands/purge/clearembed.js";

// Role
import { roleiconCommand } from "./commands/role/roleicon.js";
import { rolealiasCommand } from "./commands/role/rolealias.js";
import { roleallCommand } from "./commands/role/roleall.js";
import { roleaddCommand } from "./commands/role/roleadd.js";
import { roleremoveCommand } from "./commands/role/roleremove.js";
import { rolecreateCommand } from "./commands/role/rolecreate.js";
import { rroleCommand } from "./commands/role/rrole.js";

// Quarantine
import { quarantineCommand } from "./commands/quarantine/quarantine.js";
import { quarantineaddCommand } from "./commands/quarantine/quarantineadd.js";
import { quarantineremoveCommand } from "./commands/quarantine/quarantineremove.js";
import { quarantinesetupCommand } from "./commands/quarantine/quarantinesetup.js";
import { quarantineshowCommand } from "./commands/quarantine/quarantineshow.js";
import { quarantineresetCommand } from "./commands/quarantine/quarantinereset.js";

// Voice (single-member)
import { voiceCommand } from "./commands/voice/voice.js";
import { voicemuteCommand } from "./commands/voice/voicemute.js";
import { voiceunmuteCommand } from "./commands/voice/voiceunmute.js";
import { voicedeafenCommand } from "./commands/voice/voicedeafen.js";
import { voiceundeafenCommand } from "./commands/voice/voiceundeafen.js";
import { voicekickCommand } from "./commands/voice/voicekick.js";
import { voicepullCommand } from "./commands/voice/voicepull.js";
import { voicemoveCommand } from "./commands/voice/voicemove.js";
// Voice (all / channel-wide)
import { voicemuteallCommand } from "./commands/voice/voicemuteall.js";
import { voiceunmuteallCommand } from "./commands/voice/voiceunmuteall.js";
import { voicedeafenallCommand } from "./commands/voice/voicedeafenall.js";
import { voiceundeafenallCommand } from "./commands/voice/voiceundeafenall.js";
import { voicekickallCommand } from "./commands/voice/voicekickall.js";
import { voicemoveallCommand } from "./commands/voice/voicemoveall.js";
import { voicepullallCommand } from "./commands/voice/voicepullall.js";
import { voiceprivateCommand } from "./commands/voice/voiceprivate.js";
import { voiceunprivateCommand } from "./commands/voice/voiceunprivate.js";
import { voicelockCommand } from "./commands/voice/voicelock.js";
import { voiceunlockCommand } from "./commands/voice/voiceunlock.js";

// VC Roles
import { vcroleCommand } from "./commands/vcrole/vcrole.js";
import { vcrolesetCommand } from "./commands/vcrole/vcroleset.js";
import { vcroleremoveCommand } from "./commands/vcrole/vcroleremove.js";
import { vcroleenableCommand } from "./commands/vcrole/vcroleenable.js";
import { vcroledisableCommand } from "./commands/vcrole/vcroledisable.js";
import { vcroleShowCommand } from "./commands/vcrole/vcroleshow.js";
import { vcrolereset } from "./commands/vcrole/vcrolereset.js";

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
