import { CommandRegistry } from "../../commands/command.js";
import { ticketCommand } from "./commands/ticket.js";
import { ticketsetupCommand } from "./commands/ticket/ticketsetup.js";
import { ticketsetroleCommand } from "./commands/ticket/ticketsetrole.js";
import { ticketcloseCommand } from "./commands/ticket/ticketclose.js";
import { ticketaddCommand } from "./commands/ticket/ticketadd.js";
import { ticketremoveCommand } from "./commands/ticket/ticketremove.js";
import { ticketlistCommand } from "./commands/ticket/ticketlist.js";
import { ticketinfoCommand } from "./commands/ticket/ticketinfo.js";

export { ticketCommand, ticketsetupCommand, ticketsetroleCommand, ticketcloseCommand, ticketaddCommand, ticketremoveCommand, ticketlistCommand, ticketinfoCommand };

export function registerTickets() {
  CommandRegistry.register(ticketCommand);
  CommandRegistry.register(ticketsetupCommand);
  CommandRegistry.register(ticketsetroleCommand);
  CommandRegistry.register(ticketcloseCommand);
  CommandRegistry.register(ticketaddCommand);
  CommandRegistry.register(ticketremoveCommand);
  CommandRegistry.register(ticketlistCommand);
  CommandRegistry.register(ticketinfoCommand);
}
