import { Message, ChannelType } from "discord.js";
import { prisma } from "../services/db.js";
import { CommandContext } from "../commands/context.js";
import { handleCommand } from "../commands/command.js";
import { UniversalEmbed } from "../services/embed.js";

export async function handleMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  // 1. Increment Member Message Statistics
  await prisma.memberStats.upsert({
    where: { guildId_userId: { guildId, userId } },
    update: {
      totalMessages: { increment: 1 },
      dailyMessages: { increment: 1 },
      weeklyMessages: { increment: 1 },
      monthlyMessages: { increment: 1 }
    },
    create: {
      guildId,
      userId,
      totalMessages: 1,
      dailyMessages: 1,
      weeklyMessages: 1,
      monthlyMessages: 1
    }
  });

  // 2. AFK check: If author returns, remove AFK
  const authorStats = await prisma.memberStats.findUnique({
    where: { guildId_userId: { guildId, userId } }
  });
  if (authorStats?.afkMessage) {
    await prisma.memberStats.update({
      where: { guildId_userId: { guildId, userId } },
      data: { afkMessage: null, afkSince: null }
    });
    try {
      if (message.member?.nickname?.startsWith("[AFK] ")) {
        await message.member.setNickname(message.member.displayName.replace("[AFK] ", ""));
      }
    } catch {}
    await message.reply({ embeds: [UniversalEmbed.success(`Welcome back ${message.author}! I have removed your AFK state.`, message.guild)] });
  }

  // AFK check: Mentions check
  if (message.mentions.members && message.mentions.members.size > 0) {
    for (const [_, mentioned] of message.mentions.members) {
      if (mentioned.id === userId) continue;
      const stats = await prisma.memberStats.findUnique({
        where: { guildId_userId: { guildId, userId: mentioned.id } }
      });
      if (stats?.afkMessage) {
        await message.reply({
          embeds: [
            UniversalEmbed.info(
              `**${mentioned.user.username}** is AFK: ${stats.afkMessage} (<t:${Math.floor(stats.afkSince!.getTime() / 1000)}:R>)`,
              message.guild
            )
          ]
        });
      }
    }
  }

  // 3. Counting Game Check
  const countState = await prisma.countState.findUnique({ where: { guildId } });
  if (countState && message.channel.id === countState.channelId) {
    const val = parseInt(message.content, 10);
    const expected = countState.currentCount + 1;

    if (isNaN(val) || val !== expected || countState.lastUserId === userId) {
      // Wrong number or same user double counting -> reset count
      await prisma.countState.update({
        where: { guildId },
        data: { currentCount: 0, lastUserId: null }
      });
      await message.react("❌");
      await message.reply(`😭 **Wrong count!** The game has been reset to \`0\`. The next number is \`1\`.`);
    } else {
      // Correct count -> update count state
      const newHighScore = expected > countState.highScore ? expected : countState.highScore;
      await prisma.countState.update({
        where: { guildId },
        data: { currentCount: expected, lastUserId: userId, highScore: newHighScore }
      });
      await message.react("✅");
    }
    return; // Don't allow command processing in counting channel
  }

  // 4. Autoresponder check
  const responders = await prisma.autoResponder.findMany({ where: { guildId } });
  for (const ar of responders) {
    let triggered = false;
    if (ar.matchType === "exact" && message.content.toLowerCase() === ar.trigger.toLowerCase()) {
      triggered = true;
    } else if (ar.matchType === "contains" && message.content.toLowerCase().includes(ar.trigger.toLowerCase())) {
      triggered = true;
    } else if (ar.matchType === "regex") {
      try {
        const regex = new RegExp(ar.trigger, "i");
        triggered = regex.test(message.content);
      } catch {}
    }

    if (triggered) {
      await message.channel.send(ar.response);
      return;
    }
  }

  // 5. Command prefix resolver
  const config = await prisma.guildConfig.findUnique({ where: { guildId } });
  const prefix = config?.prefix ?? "-";

  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();
  if (!commandName) return;

  const ctx = new CommandContext(message, args);
  ctx.prefix = prefix;

  await handleCommand(ctx, commandName);
}
