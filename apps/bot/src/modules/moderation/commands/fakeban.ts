import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const fakebanCommand: Command = {
  name: "fakeban",
  description: "Sends a fake ban message without actually banning the user.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "fakeban <@member> [reason]",
  examples: ["fakeban @member Trolling", "fakeban @member"],
  execute: async (ctx) => {
    const target = ctx.getMemberOption("member", 0);
    if (!target) return ctx.wrongUsage(fakebanCommand);

    const reason = ctx.args.slice(1).join(" ") || "No reason specified";
    return ctx.reply({
      embeds: [
        UniversalEmbed.success(
          `🔨 **${target.user.tag}** has been banned from the server.\n**Reason:** ${reason}`,
          ctx.guild
        )
      ]
    });
  }
};
