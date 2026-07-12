import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { executeEnable } from "./subcommands/greet/enable.js";
import { executeDisable } from "./subcommands/greet/disable.js";
import { executeCreate } from "./subcommands/greet/create.js";
import { executeChannel } from "./subcommands/greet/channel.js";
import { executeMessage } from "./subcommands/greet/message.js";
import { executeType } from "./subcommands/greet/type.js";
import { executeAutodelete } from "./subcommands/greet/autodelete.js";
import { executeConfig } from "./subcommands/greet/config.js";
import { executeTest } from "./subcommands/greet/test.js";

export const greetCommand: Command = {
  name: "greet",
  description: "Configure welcome greetings (channel, template, style, autodelete).",
  category: "Welcomer Module",
  permissionLevel: "ADMIN",
  usage: "greet <enable | disable | create | channel [set/reset] | delete | message | type [normal/embed/both] | autodelete | config | test>",
  examples: [
    "greet enable",
    "greet channel #welcome",
    "greet message Welcome {user} to our server!",
    "greet type embed",
    "greet autodelete 10s",
    "greet config",
    "greet test"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();

    if (!action) {
      const helpEmbed = UniversalEmbed.info("Welcomer - Greet Command Help", ctx.guild)
        .setDescription(
          `• \`greet enable\` - Enable welcome messages.\n` +
          `• \`greet disable\` - Disable welcome messages.\n` +
          `• \`greet create\` - Automatically create a #welcome channel.\n` +
          `• \`greet channel <#channel>\` - Set the channel for welcome messages.\n` +
          `• \`greet channel reset\` / \`greet delete\` - Stop sending welcome messages to a channel.\n` +
          `• \`greet message <text>\` - Set the welcome message template.\n` +
          `• \`greet type/style/card <normal/embed/both>\` - Set the formatting style.\n` +
          `• \`greet autodelete <duration>\` - Automatically delete welcome messages after some time.\n` +
          `• \`greet config\` - View the current welcoming configuration.\n` +
          `• \`greet test\` - Send a test welcoming message to the welcome channel.`
        );
      return ctx.reply({ embeds: [helpEmbed] });
    }

    if (action === "enable") {
      return executeEnable(ctx);
    }
    if (action === "disable") {
      return executeDisable(ctx);
    }
    if (action === "create") {
      return executeCreate(ctx);
    }
    if (action === "channel" || action === "channel set") {
      const sub = ctx.getStringOption("channel", 1)?.toLowerCase() || ctx.getStringOption("channel", 2)?.toLowerCase();
      if (sub === "reset") {
        return executeChannel(ctx, true);
      }
      return executeChannel(ctx, false);
    }
    if (action === "channel reset" || action === "delete") {
      return executeChannel(ctx, true);
    }
    if (action === "message" || action === "msg") {
      return executeMessage(ctx);
    }
    if (action === "type" || action === "style" || action === "card") {
      return executeType(ctx);
    }
    if (action === "autodelete") {
      return executeAutodelete(ctx);
    }
    if (action === "config") {
      return executeConfig(ctx);
    }
    if (action === "test") {
      return executeTest(ctx);
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Unknown subcommand action \`${action}\`. Use \`greet\` to see valid options.`, ctx.guild)] }, 5);
  }
};
