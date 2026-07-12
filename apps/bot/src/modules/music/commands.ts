import { CommandRegistry } from "../../commands/command.js";

import { playCommand } from "./commands/play.js";
import { stopCommand } from "./commands/stop.js";
import { pauseCommand } from "./commands/pause.js";
import { resumeCommand } from "./commands/resume.js";
import { skipCommand } from "./commands/skip.js";
import { queueCommand } from "./commands/queue.js";
import { loopCommand } from "./commands/loop.js";
import { forwardCommand } from "./commands/forward.js";
import { rewindCommand } from "./commands/rewind.js";
import { nowplayingCommand } from "./commands/nowplaying.js";
import { volumeCommand } from "./commands/volume.js";
import { twentyFourSevenCommand } from "./commands/247.js";
import { joinCommand } from "./commands/join.js";

export function registerMusic() {
  CommandRegistry.register(playCommand);
  CommandRegistry.register(stopCommand);
  CommandRegistry.register(pauseCommand);
  CommandRegistry.register(resumeCommand);
  CommandRegistry.register(skipCommand);
  CommandRegistry.register(queueCommand);
  CommandRegistry.register(loopCommand);
  CommandRegistry.register(forwardCommand);
  CommandRegistry.register(rewindCommand);
  CommandRegistry.register(nowplayingCommand);
  CommandRegistry.register(volumeCommand);
  CommandRegistry.register(twentyFourSevenCommand);
  CommandRegistry.register(joinCommand);
}
