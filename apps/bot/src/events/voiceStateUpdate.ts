import { VoiceState, ChannelType, PermissionFlagsBits, EmbedBuilder } from "discord.js";
import { prisma } from "../services/db.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleVoiceStateUpdate(oldState: VoiceState, newState: VoiceState) {
  const guild = newState.guild;
  const member = newState.member;
  if (!member) return;

  // 1. Voice auto roles processing
  try {
    const list = await prisma.whitelist.findMany({
      where: { guildId: guild.id, type: "vcrole" }
    });

    if (list.length > 0) {
      const oldCh = oldState.channelId;
      const newCh = newState.channelId;

      if (!oldCh && newCh) {
        for (const item of list) {
          const limitCh = item.modules[0] || "all";
          if (limitCh === "all" || limitCh === newCh) {
            await member.roles.add(item.targetId).catch(() => null);
          }
        }
      } else if (oldCh && !newCh) {
        for (const item of list) {
          await member.roles.remove(item.targetId).catch(() => null);
        }
      } else if (oldCh && newCh && oldCh !== newCh) {
        for (const item of list) {
          const limitCh = item.modules[0] || "all";
          if (limitCh === "all" || limitCh === newCh) {
            await member.roles.add(item.targetId).catch(() => null);
          } else {
            await member.roles.remove(item.targetId).catch(() => null);
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to process voice auto roles:", err);
  }

  // 2. Temp VC Logic
  if (newState.channelId) {
    const generator = await (prisma as any).tempVCGenerator.findUnique({
      where: { channelId: newState.channelId }
    });

    if (generator) {
      try {
        const nameTemplate = generator.nameTemplate
          .replace("{username}", member.user.username)
          .replace("{user}", member.user.username);
        const parentId = generator.categoryId ?? undefined;
        const limit = generator.userLimit;

        // Create the channel
        const newCh = await guild.channels.create({
          name: nameTemplate,
          type: ChannelType.GuildVoice,
          parent: parentId,
          userLimit: limit,
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
            name: nameTemplate,
            limit: limit
          }
        });

        // Move member to new channel
        await member.voice.setChannel(newCh);

        // Send panel into VC chat
        const { sendTempVcInterface } = await import("../modules/tempvc/panel.js");
        await sendTempVcInterface(newCh, member.id);
      } catch (err) {
        console.error("⚠️ Failed to generate temp voice channel:", err);
      }
    }
  }

  // Delete channel if it becomes empty
  if (oldState.channelId) {
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

  // 3. Voice state logging
  try {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: member.user.tag,
        iconURL: member.user.displayAvatarURL({ extension: "png" })
      })
      .setTimestamp();
    const oldCh = oldState.channel;
    const newCh = newState.channel;

    if (!oldCh && newCh) {
      embed
        .setColor(0x2ecc71)
        .setTitle("🔊 Voice Channel Joined")
        .setDescription(`> **Member:** ${member} (\`${member.id}\`)\n> **Channel:** ${newCh} (\`${newCh.id}\`)`);
      await sendGuildLog(guild, "voice", embed);
    } else if (oldCh && !newCh) {
      embed
        .setColor(0xe74c3c)
        .setTitle("🔇 Voice Channel Left")
        .setDescription(`> **Member:** ${member} (\`${member.id}\`)\n> **Channel:** ${oldCh} (\`${oldCh.id}\`)`);
      await sendGuildLog(guild, "voice", embed);
    } else if (oldCh && newCh && oldCh.id !== newCh.id) {
      embed
        .setColor(0x3498db)
        .setTitle("🔀 Voice Channel Switched")
        .setDescription(
          `> **Member:** ${member} (\`${member.id}\`)\n` +
          `> **From:** ${oldCh} (\`${oldCh.id}\`)\n` +
          `> **To:** ${newCh} (\`${newCh.id}\`)`
        );
      await sendGuildLog(guild, "voice", embed);
    }
  } catch (logErr) {
    console.error("Failed to write voice logs:", logErr);
  }
}
