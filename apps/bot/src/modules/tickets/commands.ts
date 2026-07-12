import { CommandRegistry } from "../../commands/command.js";
import { ticketCommand } from "./commands/ticket.js";

export { ticketCommand };

export function registerTickets() {
  CommandRegistry.register(ticketCommand);
}
