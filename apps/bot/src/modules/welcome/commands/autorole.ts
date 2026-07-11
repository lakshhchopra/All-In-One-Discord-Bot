import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeEnable } from "./subcommands/autorole/enable.js";
import { executeDisable } from "./subcommands/autorole/disable.js";
import { executeHumans } from "./subcommands/autorole/humans.js";
import { executeBots } from "./subcommands/autorole/bots.js";
import { executeShow } from "./subcommands/autorole/show.js";
import { executeReset } from "./subcommands/autorole/reset.js";

export const autoroleCommand: Command = {
  name: "autorole",
  description: "Setup auto roles for humans and bots.",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "autorole <humans | bots | show | reset | enable | disable> [add | remove | enable | disable | show | reset] [role]",
  examples: [
    "autorole humans add @Member",
    "autorole bots add @BotRole",
    "autorole show",
    "autorole reset",
    "autorole enable",
    "autorole disable"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Welcomer - Autorole Command Help", ctx.guild)
        .setDescription(
          `• \`autorole enable\` - Enable auto role assignments.\n` +
          `• \`autorole disable\` - Disable auto role assignments.\n` +
          `• \`autorole humans <add/remove/reset/show/enable/disable>\` - Configure roles given to human members.\n` +
          `• \`autorole bots <add/remove/reset/show/enable/disable>\` - Configure roles given to bot members.\n` +
          `• \`autorole show\` - Show currently configured human and bot auto roles.\n` +
          `• \`autorole reset\` - Clear all human and bot auto roles configuration.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    if (action === "enable") {
      return executeEnable(ctx);
    }
    if (action === "disable") {
      return executeDisable(ctx);
    }
    if (action === "humans") {
      return executeHumans(ctx);
    }
    if (action === "bots") {
      return executeBots(ctx);
    }
    if (action === "show") {
      return executeShow(ctx);
    }
    if (action === "reset") {
      return executeReset(ctx);
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`autorole\` to see valid options.`, ctx.guild)] }, 5);
  }
};
