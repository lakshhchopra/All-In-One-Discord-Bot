import { GuildMember, TextChannel, AttachmentBuilder } from "discord.js";
import { prisma } from "../services/db.js";
import { drawWelcomeCard } from "../services/canvas.js";
import { parseVariables } from "../services/utils/parser.ts";

export async function handleGuildMemberAdd(member: GuildMember) {
  const guild = member.guild;

  // 1. Fetch config
  const config = await prisma.guildConfig.findUnique({
    where: { guildId: guild.id }
  });

  if (!config) return;

  // 2. Assign Auto Roles
  const isBot = member.user.bot;
  const rolesToAssign = isBot ? config.autoRolesBots : config.autoRolesHumans;

  for (const roleId of rolesToAssign) {
    try {
      const role = guild.roles.cache.get(roleId);
      if (role) {
        await member.roles.add(role);
      }
    } catch (err) {
      console.error(`⚠️ Failed to assign autorole ${roleId} to user ${member.id}:`, err);
    }
  }

  // 3. Welcome Greet card
  if (config.welcomeChannelId) {
    try {
      const ch = guild.channels.cache.get(config.welcomeChannelId) as TextChannel;
      if (ch) {
        const avatarUrl = member.user.displayAvatarURL({ extension: "png" });
        const canvasBuffer = await drawWelcomeCard(
          avatarUrl,
          member.user.username,
          guild.name,
          String(guild.memberCount)
        );

        const attachment = new AttachmentBuilder(canvasBuffer, { name: "welcome.png" });
        const template = config.welcomeMessage || "Welcome {mention} to {server}!";
        const parsedMessage = parseVariables(template, { user: member, guild });

        const sentMsg = await ch.send({
          content: parsedMessage,
          files: [attachment]
        });

        // Handle welcome autodelete
        if (config.welcomeAutoDelete && config.welcomeAutoDelete > 0) {
          setTimeout(async () => {
            try {
              await sentMsg.delete();
            } catch {}
          }, config.welcomeAutoDelete * 1000);
        }
      }
    } catch (err) {
      console.error("⚠️ Failed to process welcome message:", err);
    }
  }

  // 4. Send Welcome DM if enabled
  if (config.welcomeDmEnabled) {
    try {
      const dmTemplate = "Welcome to {server}! We are happy to have you here.";
      const parsedDm = parseVariables(dmTemplate, { user: member, guild });
      await member.send({ content: parsedDm });
    } catch {}
  }
}
