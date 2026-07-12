import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeEnable } from "./subcommands/boostgreet/enable.js";
import { executeDisable } from "./subcommands/boostgreet/disable.js";
import { executeSet } from "./subcommands/boostgreet/set.js";
import { executeShow } from "./subcommands/boostgreet/show.js";
import { executeReset } from "./subcommands/boostgreet/reset.js";
import { executeTest } from "./subcommands/boostgreet/test.js";

export const boostgreetCommand: Command = {
  name: "boostgreet",
  description: "Configure greetings when a member boosts the server.",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "boostgreet <enable | disable | set | show | reset | test> [value]",
  examples: [
    "boostgreet enable",
    "boostgreet set Thanks {user} for boosting!",
    "boostgreet set #announcements Thanks {user}!",
    "boostgreet show",
    "boostgreet reset",
    "boostgreet test"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Welcomer - Boostgreet Command Help", ctx.guild)
        .setDescription(
          `• \`boostgreet enable\` - Enable boost greetings.\n` +
          `• \`boostgreet disable\` - Disable boost greetings.\n` +
          `• \`boostgreet set <text>\` - Set the boost message template.\n` +
          `• \`boostgreet set <#channel> <text>\` - Set target channel and message template.\n` +
          `• \`boostgreet show\` - View the current boost greeting configuration.\n` +
          `• \`boostgreet reset\` - Reset boost greeting configuration.\n` +
          `• \`boostgreet test\` - Send a test boost greeting to the configured channel.`
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

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`boostgreet\` to see valid options.`, ctx.guild)] }, 5);
  }
};
