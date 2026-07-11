import { Client, Guild, GuildMember } from "discord.js";
import { prisma } from "./db.js";

// Cache structure: Map<guildId, Map<inviteCode, { uses: number, inviterId: string | null }>>
const invitesCache = new Map<string, Map<string, { uses: number; inviterId: string | null }>>();

export async function initInviteTracker(client: Client) {
  for (const [guildId, guild] of client.guilds.cache) {
    await cacheGuildInvites(guild);
  }
}

export async function cacheGuildInvites(guild: Guild) {
  try {
    const invites = await guild.invites.fetch().catch(() => null);
    if (!invites) return;
    const cache = new Map<string, { uses: number; inviterId: string | null }>();
    for (const invite of invites.values()) {
      cache.set(invite.code, { uses: invite.uses || 0, inviterId: invite.inviter?.id || null });
    }
    invitesCache.set(guild.id, cache);
  } catch (err) {
    console.error(`⚠️ Failed to cache invites for guild ${guild.id}:`, err);
  }
}

export async function trackMemberJoin(member: GuildMember): Promise<{ inviterId: string | null; code: string | null } | null> {
  const guild = member.guild;
  const invites = await guild.invites.fetch().catch(() => null);
  if (!invites) return null;

  const cached = invitesCache.get(guild.id);
  let resolvedInvite: any = null;

  if (cached) {
    for (const invite of invites.values()) {
      const cachedInv = cached.get(invite.code);
      if (cachedInv && (invite.uses || 0) > cachedInv.uses) {
        resolvedInvite = invite;
        break;
      }
    }
  }

  // Update cache
  const newCache = new Map<string, { uses: number; inviterId: string | null }>();
  for (const invite of invites.values()) {
    newCache.set(invite.code, { uses: invite.uses || 0, inviterId: invite.inviter?.id || null });
  }
  invitesCache.set(guild.id, newCache);

  if (!resolvedInvite) {
    return null;
  }

  const inviterId = resolvedInvite.inviter?.id || null;
  const code = resolvedInvite.code;

  if (!inviterId) return null;

  // Determine if it is a fake invite: Joined user's account age < 24 hours
  const isFake = (Date.now() - member.user.createdTimestamp) < 86400000;

  // Save/Update inviter stats
  await prisma.memberStats.upsert({
    where: { guildId_userId: { guildId: guild.id, userId: inviterId } },
    update: {
      invitesCount: isFake ? undefined : { increment: 1 },
      fakeInvites: isFake ? { increment: 1 } : undefined
    },
    create: {
      guildId: guild.id,
      userId: inviterId,
      invitesCount: isFake ? 0 : 1,
      fakeInvites: isFake ? 1 : 0
    }
  });

  // Save to MemberStats for joined member
  await prisma.memberStats.upsert({
    where: { guildId_userId: { guildId: guild.id, userId: member.id } },
    update: {
      inviterId,
      inviteCode: code
    },
    create: {
      guildId: guild.id,
      userId: member.id,
      inviterId,
      inviteCode: code
    }
  });

  // Log to InviteLog
  await prisma.inviteLog.create({
    data: {
      guildId: guild.id,
      userId: member.id,
      code,
      inviterId,
      fake: isFake
    }
  });

  // Check and award Invite Rewards if applicable
  await checkInviteRewards(guild, inviterId);

  return { inviterId, code };
}

export async function trackMemberLeave(member: GuildMember) {
  const guild = member.guild;
  
  // Find joined member stats
  const memberStats = await prisma.memberStats.findUnique({
    where: { guildId_userId: { guildId: guild.id, userId: member.id } }
  });

  if (memberStats?.inviterId) {
    const inviterId = memberStats.inviterId;

    // Check if the join log was fake
    const inviteLog = await prisma.inviteLog.findFirst({
      where: { guildId: guild.id, userId: member.id },
      orderBy: { joinedAt: "desc" }
    });

    // Update inviter stats
    await prisma.memberStats.upsert({
      where: { guildId_userId: { guildId: guild.id, userId: inviterId } },
      update: {
        leftInvites: { increment: 1 }
      },
      create: {
        guildId: guild.id,
        userId: inviterId,
        leftInvites: 1
      }
    });

    // Update log
    if (inviteLog) {
      await prisma.inviteLog.update({
        where: { id: inviteLog.id },
        data: { leftAt: new Date() }
      });
    }

    // Check and award Invite Rewards if role needs removal or recalculation
    await checkInviteRewards(guild, inviterId);
  }
}

async function checkInviteRewards(guild: Guild, inviterId: string) {
  try {
    const stats = await prisma.memberStats.findUnique({
      where: { guildId_userId: { guildId: guild.id, userId: inviterId } }
    });
    if (!stats) return;

    const net = Math.max(0, (stats.invitesCount || 0) + (stats.bonusInvites || 0) - (stats.fakeInvites || 0) - (stats.leftInvites || 0));

    // Get rewards for this guild
    const rewards = await prisma.inviteReward.findMany({
      where: { guildId: guild.id }
    });

    const member = await guild.members.fetch(inviterId).catch(() => null);
    if (!member) return;

    for (const reward of rewards) {
      if (net >= reward.inviteCount) {
        if (!member.roles.cache.has(reward.roleId)) {
          await member.roles.add(reward.roleId).catch(() => null);
        }
      } else {
        if (member.roles.cache.has(reward.roleId)) {
          await member.roles.remove(reward.roleId).catch(() => null);
        }
      }
    }
  } catch (err) {
    console.error("⚠️ Failed to check invite rewards:", err);
  }
}
