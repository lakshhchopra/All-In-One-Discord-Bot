import { Command } from "../../../commands/types.js";
import { UniversalEmbed } from "../../../services/embed.js";

// Import all subcommands
import { tempvcsetupCommand } from "./tempvc/tempvcsetup.js";
import { tempvcsendpanelCommand } from "./tempvc/tempvcsendpanel.js";
import { tempvcgeneratorCommand } from "./tempvc/tempvcgenerator.js";
import { tempvcclaimCommand } from "./tempvc/tempvcclaim.js";
import { tempvclockCommand } from "./tempvc/tempvclock.js";
import { tempvcunlockCommand } from "./tempvc/tempvcunlock.js";
import { tempvchideCommand } from "./tempvc/tempvchide.js";
import { tempvcunhideCommand } from "./tempvc/tempvcunhide.js";
import { tempvcrenameCommand } from "./tempvc/tempvcrename.js";
import { tempvclimitCommand } from "./tempvc/tempvclimit.js";
import { tempvcregionCommand } from "./tempvc/tempvcregion.js";
import { tempvcblockCommand } from "./tempvc/tempvcblock.js";
import { tempvctrustCommand } from "./tempvc/tempvctrust.js";
import { tempvcuntrustCommand } from "./tempvc/tempvcuntrust.js";
import { tempvckickCommand } from "./tempvc/tempvckick.js";
import { tempvctransferCommand } from "./tempvc/tempvctransfer.js";

const subcommands: Record<string, Command> = {
  setup: tempvcsetupCommand,
  sendpanel: tempvcsendpanelCommand,
  generator: tempvcgeneratorCommand,
  claim: tempvcclaimCommand,
  lock: tempvclockCommand,
  unlock: tempvcunlockCommand,
  hide: tempvchideCommand,
  unhide: tempvcunhideCommand,
  uhide: tempvcunhideCommand,
  rename: tempvcrenameCommand,
  name: tempvcrenameCommand,
  limit: tempvclimitCommand,
  region: tempvcregionCommand,
  block: tempvcblockCommand,
  trust: tempvctrustCommand,
  untrust: tempvcuntrustCommand,
  kick: tempvckickCommand,
  remove: tempvckickCommand,
  transfer: tempvctransferCommand
};

export const tempvcCommand: Command = {
  name: "tempvc",
  aliases: ["tvc", "voice", "vc"],
  description: "Temporary voice channel configuration and management commands.",
  category: "TempVC",
  permissionLevel: "USER",
  usage: "tempvc <subcommand>",
  execute: async (ctx: any) => {
    const subcommandName = ctx.args[0]?.toLowerCase();
    
    if (!subcommandName || !subcommands[subcommandName]) {
      // Build a help menu if no valid subcommand provided
      const embed = UniversalEmbed.info("Temporary Voice Commands", ctx.guild)
        .setDescription(
          "**Admin Commands:**\\n" +
          "\`tempvc setup\` - Configure TempVC system\\n" +
          "\`tempvc sendpanel\` - Send management panel\\n" +
          "\`tempvc generator\` - Add another generator channel\\n\\n" +
          "**User Commands:**\\n" +
          "\`tempvc claim\` - Claim inactive TempVC\\n" +
          "\`tempvc lock / unlock\` - Lock/unlock your TempVC\\n" +
          "\`tempvc hide / unhide\` - Hide/unhide your TempVC\\n" +
          "\`tempvc rename <name>\` - Rename your TempVC\\n" +
          "\`tempvc limit <number>\` - Set user limit (0-99)\\n" +
          "\`tempvc region <region>\` - Change RTC region\\n" +
          "\`tempvc block <user>\` - Block a user\\n" +
          "\`tempvc trust <user>\` - Trust a user to bypass lock\\n" +
          "\`tempvc untrust <user>\` - Remove trust from a user\\n" +
          "\`tempvc kick <user>\` - Kick user from your TempVC\\n" +
          "\`tempvc transfer <user>\` - Transfer TempVC ownership"
        );
      return ctx.reply({ embeds: [embed] });
    }

    // Execute the matched subcommand
    const subcommand = subcommands[subcommandName];
    
    // Check permission level for the subcommand
    if (subcommand.permissionLevel === "ADMIN" && !ctx.member.permissions.has("Administrator")) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need Administrator permissions to use this subcommand.", ctx.guild)] }, 5);
    }
    
    // Replace args and execute
    ctx.args = ctx.args.slice(1);
    await subcommand.execute(ctx);
  }
};
