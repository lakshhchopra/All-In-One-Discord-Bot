import { CommandRegistry } from "../../commands/command.js";
import { pingCommand } from "./commands/ping.js";
import { afkCommand } from "./commands/afk.js";
import { userinfoCommand } from "./commands/userinfo.js";
import { serverinfoCommand } from "./commands/serverinfo.js";
import { avatarCommand } from "./commands/avatar.js";
import { membercountCommand } from "./commands/membercount.js";
import { botinfoCommand } from "./commands/botinfo.js";

export { pingCommand, afkCommand, userinfoCommand, serverinfoCommand, avatarCommand, membercountCommand, botinfoCommand };

export function registerInfo() {
  CommandRegistry.register(pingCommand);
  CommandRegistry.register(afkCommand);
  CommandRegistry.register(userinfoCommand);
  CommandRegistry.register(serverinfoCommand);
  CommandRegistry.register(avatarCommand);
  CommandRegistry.register(membercountCommand);
  CommandRegistry.register(botinfoCommand);
}
