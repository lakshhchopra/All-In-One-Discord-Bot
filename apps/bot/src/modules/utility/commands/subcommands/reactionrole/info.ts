import { CommandContext } from "../../../../../commands/context.js";
import { UniversalEmbed } from "../../../../../services/embed.js";

export async function executeInfo(ctx: CommandContext) {
  return ctx.reply({
    embeds: [
      UniversalEmbed.info("Reaction Roles Utilities", ctx.guild)
        .setDescription(
          `- **Maximum Roles Limit:** Unlimited\n` +
          `- **Action Format:** \`reactionrole <add | remove | show> <messageId> <emoji> <@role>\`\n` +
          `- **Status:** Fully operational.`
        )
    ]
  });
}
