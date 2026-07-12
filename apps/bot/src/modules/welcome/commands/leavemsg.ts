import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeEnable } from "./subcommands/leavemsg/enable.js";
import { executeDisable } from "./subcommands/leavemsg/disable.js";
import { executeSet } from "./subcommands/leavemsg/set.js";
import { executeShow } from "./subcommands/leavemsg/show.js";
import { executeReset } from "./subcommands/leavemsg/reset.js";
import { executeTest } from "./subcommands/leavemsg/test.js";

export const leavemsgCommand: Command = {
  name: "leavemsg",
  description: "Configure leave messages when a user leaves the server.",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "leavemsg <enable | disable | set | show | reset | test> [value]",
  examples: [
    "leavemsg enable",
    "leavemsg set Good bye {user}!",
    "leavemsg set #goodbyes Good bye {user}!",
    "leavemsg show",
    "leavemsg reset",
    "leavemsg test"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Welcomer - Leavemsg Command Help", ctx.guild)
        .setDescription(
          `• \`leavemsg enable\` - Enable leave messages in a text channel.\n` +
          `• \`leavemsg disable\` - Disable leave messages.\n` +
          `• \`leavemsg set <text>\` - Set the leave message template.\n` +
          `• \`leavemsg set <#channel> <text>\` - Set target channel and message template.\n` +
          `• \`leavemsg show\` - View the current leave messaging configuration.\n` +
          `• \`leavemsg reset\` - Reset leave messaging configuration.\n` +
          `• \`leavemsg test\` - Send a test leave message to the configured channel.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    if (action === "enable") {
      return executeEnable(ctx);
    }
    if (action === "disable") {
      return executeDisable(ctx);
    }
    if (action === "set") {
      return executeSet(ctx);
    }
    if (action === "show") {
      return executeShow(ctx);
    }
    if (action === "reset") {
      return executeReset(ctx);
    }
    if (action === "test") {
      return executeTest(ctx);
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`leavemsg\` to see valid options.`, ctx.guild)] }, 5);
  }
};
