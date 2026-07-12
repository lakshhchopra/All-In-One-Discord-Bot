import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const roleinfoCommand: Command = {
  name: "roleinfo",
  description: "View detailed statistics and permissions of a role.",
  category: "General Commands",
  usage: "roleinfo <@role>",
  examples: ["roleinfo @Admin"],
  execute: async (ctx: any) => {
    const role = ctx.getRoleOption("role", 0);
    if (!role) return ctx.wrongUsage(roleinfoCommand);

    const r = role as any;
    const timestamp = Math.floor((r.createdTimestamp ?? 0) / 1000);
    const membersCount = r.members?.size ?? 0;
    const colorHex = r.hexColor ?? "#000000";

    const embed = UniversalEmbed.neutral(`Role Info: ${role.name}`, ctx.guild)
      .addFields(
        { name: "Role Name", value: role.name, inline: true },
        { name: "Role ID", value: `\`${role.id}\``, inline: true },
        { name: "Color", value: `\`${colorHex}\``, inline: true },
        { name: "Position", value: `\`${role.position}\``, inline: true },
        { name: "Members", value: `\`${membersCount}\``, inline: true },
        { name: "Mentionable", value: role.mentionable ? "Yes" : "No", inline: true },
        { name: "Created At", value: `<t:${timestamp}:F> (<t:${timestamp}:R>)`, inline: false }
      );

    return ctx.reply({ embeds: [embed] });
  }
};

