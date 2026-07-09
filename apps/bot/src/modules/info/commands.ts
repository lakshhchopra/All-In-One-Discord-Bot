import { CommandRegistry } from "../../commands/command.js";

// Basic Info
import { infoCommand } from "./commands/info.js";
import { prefixCommand } from "./commands/prefix.js";
import { noprefixCommand } from "./commands/noprefix.js";
import { afkCommand } from "./commands/afk.js";
import { userinfoCommand } from "./commands/userinfo.js";
import { serverinfoCommand } from "./commands/serverinfo.js";
import { avatarCommand } from "./commands/avatar.js";
import { membercountCommand } from "./commands/membercount.js";
import { boostcountCommand } from "./commands/boostcount.js";
import { joinedatCommand } from "./commands/joinedat.js";
import { channelinfoCommand } from "./commands/channelinfo.js";
import { roleinfoCommand } from "./commands/roleinfo.js";
import { bannerCommand } from "./commands/banner.js";
import { servericonCommand } from "./commands/servericon.js";
import { serverbannerCommand } from "./commands/serverbanner.js";
import { profileCommand } from "./commands/profile.js";
import { voteCommand } from "./commands/vote.js";

// List commands
import { listCommand } from "./commands/list.js";
import { listmodsCommand } from "./commands/listmods.js";
import { listactivedeveloperCommand } from "./commands/listactivedeveloper.js";
import { listpendingCommand } from "./commands/listpending.js";
import { listinroleCommand } from "./commands/listinrole.js";
import { listrolesCommand } from "./commands/listroles.js";
import { listusersCommand } from "./commands/listusers.js";
import { listemojisCommand } from "./commands/listemojis.js";
import { listcreatedatCommand } from "./commands/listcreatedat.js";
import { listchannelsCommand } from "./commands/listchannels.js";
import { listbansCommand } from "./commands/listbans.js";
import { listhaspermsCommand } from "./commands/listhasperms.js";
import { listinvoiceCommand } from "./commands/listinvoice.js";
import { listearlyCommand } from "./commands/listearly.js";
import { listhypesquadCommand } from "./commands/listhypesquad.js";
import { listadminsCommand } from "./commands/listadmins.js";
import { listbotsCommand } from "./commands/listbots.js";
import { listbughuntersCommand } from "./commands/listbughunters.js";
import { listtimeoutsCommand } from "./commands/listtimeouts.js";
import { listjoinedatCommand } from "./commands/listjoinedat.js";
import { listboostersCommand } from "./commands/listboosters.js";

export {
  infoCommand,
  prefixCommand,
  noprefixCommand,
  afkCommand,
  userinfoCommand,
  serverinfoCommand,
  avatarCommand,
  membercountCommand,
  boostcountCommand,
  joinedatCommand,
  channelinfoCommand,
  roleinfoCommand,
  bannerCommand,
  servericonCommand,
  serverbannerCommand,
  profileCommand,
  voteCommand,
  listCommand,
  listmodsCommand,
  listactivedeveloperCommand,
  listpendingCommand,
  listinroleCommand,
  listrolesCommand,
  listusersCommand,
  listemojisCommand,
  listcreatedatCommand,
  listchannelsCommand,
  listbansCommand,
  listhaspermsCommand,
  listinvoiceCommand,
  listearlyCommand,
  listhypesquadCommand,
  listadminsCommand,
  listbotsCommand,
  listbughuntersCommand,
  listtimeoutsCommand,
  listjoinedatCommand,
  listboostersCommand
};

export function registerInfo() {
  CommandRegistry.register(infoCommand);
  CommandRegistry.register(prefixCommand);
  CommandRegistry.register(noprefixCommand);
  CommandRegistry.register(afkCommand);
  CommandRegistry.register(userinfoCommand);
  CommandRegistry.register(serverinfoCommand);
  CommandRegistry.register(avatarCommand);
  CommandRegistry.register(membercountCommand);
  CommandRegistry.register(boostcountCommand);
  CommandRegistry.register(joinedatCommand);
  CommandRegistry.register(channelinfoCommand);
  CommandRegistry.register(roleinfoCommand);
  CommandRegistry.register(bannerCommand);
  CommandRegistry.register(servericonCommand);
  CommandRegistry.register(serverbannerCommand);
  CommandRegistry.register(profileCommand);
  CommandRegistry.register(voteCommand);

  CommandRegistry.register(listCommand);
  CommandRegistry.register(listmodsCommand);
  CommandRegistry.register(listactivedeveloperCommand);
  CommandRegistry.register(listpendingCommand);
  CommandRegistry.register(listinroleCommand);
  CommandRegistry.register(listrolesCommand);
  CommandRegistry.register(listusersCommand);
  CommandRegistry.register(listemojisCommand);
  CommandRegistry.register(listcreatedatCommand);
  CommandRegistry.register(listchannelsCommand);
  CommandRegistry.register(listbansCommand);
  CommandRegistry.register(listhaspermsCommand);
  CommandRegistry.register(listinvoiceCommand);
  CommandRegistry.register(listearlyCommand);
  CommandRegistry.register(listhypesquadCommand);
  CommandRegistry.register(listadminsCommand);
  CommandRegistry.register(listbotsCommand);
  CommandRegistry.register(listbughuntersCommand);
  CommandRegistry.register(listtimeoutsCommand);
  CommandRegistry.register(listjoinedatCommand);
  CommandRegistry.register(listboostersCommand);
}
