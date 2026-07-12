import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { prisma } from "../../../../services/db.js";

export const quarantineshowCommand: Command = {
  name: "quarantineshow",
  aliases: ["quarantine show"],
  description: "List all currently quarantined members in this server.",
  category: "Moderation",
  permissionLevel: "ADMIN",
  usage: "quarantineshow",
  examples: ["quarantineshow"],
  execute: async (ctx) => {
    const config = await prisma.guildConfig.findUnique({ where: { guildId: ctx.guild.id } }) as any;
    if (!config?.quarantineRoleId) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Quarantine role is not configured. Use `quarantinesetup @role` first.", ctx.guild)] }, 5);
    }

    const list = ctx.guild.members.cache.filter(m => m.roles.cache.has(config.quarantineRoleId!));
    const description = list.size > 0
      ? list.map(m => `• **${m.user.tag}** (\`${m.id}\`)`).join("\n")
      : "No members are currently quarantined.";

    return ctx.reply({
      embeds: [
        UniversalEmbed.info("🔒 Quarantined Members", ctx.guild)
          .setDescription(description)
          .setFooter({ text: `Total: ${list.size} member(s)` })
      ]
    });
  }
};
