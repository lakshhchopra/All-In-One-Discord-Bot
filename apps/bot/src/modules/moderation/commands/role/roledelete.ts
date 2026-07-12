import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const roledeleteCommand: Command = {
  name: "roledelete",
  aliases: ["role delete"],
  description: "Delete a specified role.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "role delete <@role>",
  examples: ["role delete @OldRole"],
  execute: async (ctx: any) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    let role = ctx.getRoleOption("role", 0);
    if (!role && ctx.args[0]?.toLowerCase() === "delete") {
      role = ctx.getRoleOption("role", 1);
    }

    if (!role) return ctx.wrongUsage(roledeleteCommand);

    const name = role.name;
    try {
      await (role as any).delete(`Deleted by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`🗑️ Deleted role **${name}**.`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error(`Could not delete role **${name}**. Make sure my role is higher than the target role.`, ctx.guild)] }, 5);
    }
  }
};

