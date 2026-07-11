import { GuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { prisma } from "../services/db.js";
import { parseVariables } from "../services/utils/parser.js";
import { parseFunctions, executeSend } from "../services/utils/placeholder.js";
import { trackMemberJoin } from "../services/invites.js";

export async function handleGuildMemberAdd(member: GuildMember) {
  await trackMemberJoin(member).catch(() => null);
  const guild = member.guild;

  // 1. Fetch config
  const config = (await prisma.guildConfig.findUnique({
    where: { guildId: guild.id }
  })) as any;

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

  // 3. Welcome Greet
  if (config.welcomeChannelId) {
    try {
      const ch = guild.channels.cache.get(config.welcomeChannelId) as TextChannel;
      if (ch) {
        const template = config.welcomeMessage || "Welcome {mention} to {server}!";
        const parserCtx = { user: member, guild };
        const parsedMessage = parseVariables(template, parserCtx);

        let finalPayload: any;

        if (parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:")) {
          finalPayload = await parseFunctions(parsedMessage, guild.id, parserCtx);
        } else {
          const welcomeType = config.welcomeType || "both";
          if (welcomeType === "normal") {
            finalPayload = { content: parsedMessage };
          } else {
            const embed = new EmbedBuilder()
              .setTitle(`Welcome to ${guild.name}!`)
              .setDescription(parsedMessage)
              .setThumbnail(member.user.displayAvatarURL({ extension: "png" }))
              .setColor(0x3498db)
              .setTimestamp();

            if (welcomeType === "embed") {
              finalPayload = { embeds: [embed] };
            } else {
              // both
              finalPayload = {
                content: `Welcome ${member}!`,
                embeds: [embed]
              };
            }
          }
        }

        const sentMsg = await executeSend(ch, finalPayload, member, guild);

        // Handle welcome autodelete if not overridden by dynamic delete_reply
        if (sentMsg && (!finalPayload.deleteReplyAfter || finalPayload.deleteReplyAfter <= 0)) {
          if (config.welcomeAutoDelete && config.welcomeAutoDelete > 0) {
            setTimeout(async () => {
              try {
                await sentMsg.delete();
              } catch {}
            }, config.welcomeAutoDelete * 1000);
          }
        }
      }
    } catch (err) {
      console.error("⚠️ Failed to process welcome message:", err);
    }
  }

}
