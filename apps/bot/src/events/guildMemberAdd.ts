import { GuildMember, TextChannel, EmbedBuilder } from "discord.js";
import { prisma } from "../services/db.js";
import { parseVariables, parseObjectVariables } from "../services/utils/parser.js";
import { parseEmbedPlaceholder } from "../services/utils/placeholder.js";

export async function handleGuildMemberAdd(member: GuildMember) {
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
        const parsedMessage = parseVariables(template, { user: member, guild });

        let sendPayload: any = {};

        if (parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:")) {
          const res = await parseEmbedPlaceholder(parsedMessage, guild.id);
          let embeds = res.embeds || [];
          if (embeds.length > 0) {
            embeds = embeds.map(emb => parseObjectVariables(emb, { user: member, guild }));
          }
          sendPayload = {
            content: res.content || undefined,
            embeds
          };
        } else {
          const welcomeType = config.welcomeType || "both";
          if (welcomeType === "normal") {
            sendPayload = { content: parsedMessage };
          } else {
            const embed = new EmbedBuilder()
              .setTitle(`Welcome to ${guild.name}!`)
              .setDescription(parsedMessage)
              .setThumbnail(member.user.displayAvatarURL({ extension: "png" }))
              .setColor(0x3498db)
              .setTimestamp();

            if (welcomeType === "embed") {
              sendPayload = { embeds: [embed] };
            } else {
              // both
              sendPayload = {
                content: `Welcome ${member}!`,
                embeds: [embed]
              };
            }
          }
        }

        const sentMsg = await ch.send(sendPayload);

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
