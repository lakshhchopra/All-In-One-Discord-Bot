import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { isDeveloper } from "../../../utils/security.js";
import { prisma } from "../../../services/db.js";

export const addOwnerCommand: Command = {
  name: "addowner",
  aliases: ["adddev", "botowner"],
  description: "Add a global Bot Developer.",
  category: "Developer",
  usage: "addowner <@user | user_id>",
  execute: async (ctx: any) => {
    // Only existing developers can add new developers
    const isDev = await isDeveloper(ctx.user.id);
    if (!isDev) {
      return ctx.reply({ embeds: [UniversalEmbed.error("This command is restricted to Bot Developers.", ctx.guild)] }, 5);
    }

    const targetId = ctx.args[0]?.replace(/[<@!>]/g, "");
    if (!targetId) {
      return ctx.wrongUsage(addOwnerCommand);
    }

    let targetUser;
    try {
      targetUser = await ctx.client.users.fetch(targetId);
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error("Could not find a user with that ID.", ctx.guild)] }, 5);
    }

    try {
      // Create new developer
      await (prisma as any).botDeveloper.upsert({
        where: { userId: targetId },
        update: {},
        create: {
          userId: targetId,
          addedBy: ctx.user.id,
        }
      });

      return ctx.reply({ 
        embeds: [UniversalEmbed.success(`✅ Successfully added **${targetUser.username}** as a Global Bot Developer.`, ctx.guild)] 
      });
    } catch (e: any) {
      console.error(e);
      return ctx.reply({ 
        embeds: [UniversalEmbed.error("An error occurred while adding the bot developer to the database.", ctx.guild)] 
      }, 5);
    }
  }
};

