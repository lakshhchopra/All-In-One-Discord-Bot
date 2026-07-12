import { CommandContext } from "../../../commands/context.js";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

import { ticketsetupCommand } from "./ticket/ticketsetup.js";
import { ticketsetroleCommand } from "./ticket/ticketsetrole.js";
import { ticketcloseCommand } from "./ticket/ticketclose.js";
import { ticketaddCommand } from "./ticket/ticketadd.js";
import { ticketremoveCommand } from "./ticket/ticketremove.js";
import { ticketlistCommand } from "./ticket/ticketlist.js";
import { ticketinfoCommand } from "./ticket/ticketinfo.js";

export const ticketCommand: Command = {
  name: "ticket",
  aliases: ["tickets"],
  description: "Setup and manage the support ticket system.",
  category: "Ticket",
  permissionLevel: "ADMIN",
  usage: "ticket <setup | setrole @role | close | reopen | transcript | rename | add | remove | list | panel>",
  examples: [
    "ticket setup",
    "ticket setrole @Staff",
    "ticket close",
    "ticket add @member",
    "ticket remove @member"
  ],
  execute: async (ctx: any) => {
    const sub = ctx.args[0]?.toLowerCase();

    if (["setup", "panel", "setrole", "support", "close", "add", "remove", "delete", "list", "reopen", "transcript", "greetmsg", "category", "type", "autotranscript", "logging", "maxtickets"].includes(sub)) {
      ctx.args.shift();
    }

    if (sub === "setup" || sub === "panel") return ticketsetupCommand.execute(ctx);
    if (sub === "setrole" || sub === "support") return ticketsetroleCommand.execute(ctx);
    if (sub === "close") return ticketcloseCommand.execute(ctx);
    if (sub === "add") return ticketaddCommand.execute(ctx);
    if (sub === "remove" || sub === "delete") return ticketremoveCommand.execute(ctx);
    if (sub === "list") return ticketlistCommand.execute(ctx);
    if (["reopen", "transcript", "greetmsg", "category", "type", "autotranscript", "logging", "maxtickets"].includes(sub)) {
      return ticketinfoCommand.execute(ctx);
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `ticket <setup | setrole | close | add | remove | list | panel>`", ctx.guild)] });
  }
};

