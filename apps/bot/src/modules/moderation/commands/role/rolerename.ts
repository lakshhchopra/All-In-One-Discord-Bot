import { PermissionFlagsBits } from "discord.js";
import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const rolerenameCommand: Command = {
  name: "rolerename",
  aliases: ["role rename"],
  description: "Rename a specified role.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "role rename <@role> <new name>",
  examples: ["role rename @OldRole NewName"],
  execute: async (ctx: any) => {
    if (!ctx.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Permission missing: `Manage Roles`", ctx.guild)] }, 5);
    }

    let role = ctx.getRoleOption("role", 0);
    let newNameOffset = 1;

    if (!role && ctx.args[0]?.toLowerCase() === "rename") {
      role = ctx.getRoleOption("role", 1);
      newNameOffset = 2;
    }

    const newName = ctx.args.slice(newNameOffset).join(" ");

    if (!role || !newName) return ctx.wrongUsage(rolerenameCommand);

    try {
      await (role as any).setName(newName, `Renamed by ${ctx.user.tag}`);
      return ctx.reply({ embeds: [UniversalEmbed.success(`✏️ Renamed role to **${newName}**.`, ctx.guild)] });
    } catch {
      return ctx.reply({ embeds: [UniversalEmbed.error(`Could not rename role. Make sure my role is higher than the target role.`, ctx.guild)] }, 5);
    }
  }
};

