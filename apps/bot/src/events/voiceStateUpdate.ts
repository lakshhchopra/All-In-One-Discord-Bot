import { VoiceState, ChannelType, PermissionFlagsBits } from "discord.js";
import { prisma } from "../services/db.js";

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const guild = newState.guild;
  const member = newState.member;
  if (!member) return;

  // 1. Voice auto roles processing
  const config = await prisma.guildConfig.findUnique({ where: { guildId: guild.id } });
  const settings = (config?.logToggles as Record<string, any>) ?? {};
  const isBot = member.user.bot;
  const vcRoles = isBot ? (settings.vcRolesBots ?? []) : (settings.vcRolesHumans ?? []);

  // Member joined voice channel
  if (!oldState.channelId && newState.channelId) {
    for (const rId of vcRoles) {
      try {
        await member.roles.add(rId);
      } catch {}
    }
  }
  // Member left voice channel
  else if (oldState.channelId && !newState.channelId) {
    for (const rId of vcRoles) {
      try {
        await member.roles.remove(rId);
      } catch {}
    }
  }

  // 2. Temp VC Logic
  if (config?.tempVcGeneratorId) {
    // Member joined the generator channel
    if (newState.channelId === config.tempVcGeneratorId) {
      try {
        const nameTemplate = config.tempVcNameTemplate.replace("{username}", member.user.username);
        const parentId = config.tempVcCategoryId ?? undefined;

        // Create the channel
        const newCh = await guild.channels.create({
          name: nameTemplate,
          type: ChannelType.GuildVoice,
          parent: parentId,
          permissionOverwrites: [
            {
              id: member.id,
              allow: [
                PermissionFlagsBits.Connect,
                PermissionFlagsBits.Speak,
                PermissionFlagsBits.MuteMembers,
                PermissionFlagsBits.DeafenMembers,
                PermissionFlagsBits.MoveMembers
              ]
            }
          ]
        });

        // Record in DB
        await prisma.tempVC.create({
          data: {
            channelId: newCh.id,
            guildId: guild.id,
            ownerId: member.id,
            name: nameTemplate
          }
        });

        // Move member to new channel
        await member.voice.setChannel(newCh);
      } catch (err) {
        console.error("⚠️ Failed to generate temp voice channel:", err);
      }
    }
  }

  // Delete channel if it becomes empty
  if (oldState.channelId && oldState.channelId !== config?.tempVcGeneratorId) {
    const oldCh = oldState.channel;
    if (oldCh && oldCh.type === ChannelType.GuildVoice) {
      // Check if it is a managed temp VC
      const dbVc = await prisma.tempVC.findUnique({
        where: { channelId: oldCh.id }
      });

      if (dbVc && oldCh.members.size === 0) {
        try {
          await oldCh.delete("Temp VC empty");
          await prisma.tempVC.delete({ where: { channelId: oldCh.id } });
        } catch {}
      }
    }
  }
}
