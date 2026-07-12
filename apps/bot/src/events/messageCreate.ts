import { Message, ChannelType } from "discord.js";
import { prisma } from "../services/db.js";
import { CacheService } from "../services/cache.js";
import { CommandContext } from "../commands/context.js";
import { EMOJIS } from "../config/emojis.js";
import { handleCommand, CommandRegistry } from "../commands/command.js";
import { UniversalEmbed } from "../services/embed.js";
import { parseVariables } from "../services/utils/parser.js";
import { parseFunctions, executeSend } from "../services/utils/placeholder.js";
import { isWhitelisted } from "../utils/security.js";

export async function handleMessageCreate(message: Message) {
  if (message.author.bot || !message.guild) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  // 0. Fetch only the most critical config (Read-Only to save write latency)
  const guildConfig = await CacheService.getGuildConfig(guildId);
  const prefix = guildConfig?.prefix ?? "-";



  // 1. Increment Member Message Statistics (Fire and Forget)
  prisma.memberStats.upsert({
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
  }).catch(() => null);

  // 2. AFK check: If author returns, remove AFK asynchronously (Fire and Forget)
  prisma.memberStats.findUnique({ where: { guildId_userId: { guildId, userId } } }).then(async (authorStats) => {
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
      await (message.channel as any).send({ content: `<@${message.author.id}>`, embeds: [UniversalEmbed.success(`Welcome back ${message.author}! I have removed your AFK state.`, message.guild!)] }).catch(() => null);
    }
  }).catch(() => null);

  // AFK check: Mentions check
  if (message.mentions.members && message.mentions.members.size > 0) {
    for (const [_, mentioned] of message.mentions.members) {
      if (mentioned.id === userId) continue;
      const stats = await prisma.memberStats.findUnique({
        where: { guildId_userId: { guildId, userId: mentioned.id } }
      });
      if (stats?.afkMessage) {
        await (message.channel as any).send({
          content: `<@${message.author.id}>`,
          embeds: [
            UniversalEmbed.info(
              `**${mentioned.user.username}** is AFK: ${stats.afkMessage} (<t:${Math.floor(stats.afkSince!.getTime() / 1000)}:R>)`,
              message.guild
            )
          ]
        }).catch(() => null);
      }
    }
  }

  // 3. Counting Game Check
  // Only query countState if message is purely a number to save DB calls
  const val = parseInt(message.content, 10);
  if (!isNaN(val) && val.toString() === message.content.trim()) {
    const countState = await prisma.countState.findUnique({ where: { guildId } });
    if (countState && message.channel.id === countState.channelId) {
      const expected = countState.currentCount + 1;

      if (val !== expected || countState.lastUserId === userId) {
        // Incorrect count (wrong number or consecutive count by same user)
        // Give -1 to stats, do NOT reset count or streak
        await prisma.countingStats.upsert({
          where: { guildId_userId: { guildId, userId } },
          update: { score: { decrement: 1 } },
          create: { guildId, userId, score: -1 }
        });
        await message.react("❌").catch(() => null);
      } else {
        // Correct count
        const newHighScore = expected > countState.highScore ? expected : countState.highScore;
        await prisma.countState.update({
          where: { guildId },
          data: { currentCount: expected, lastUserId: userId, highScore: newHighScore }
        });
        await prisma.countingStats.upsert({
          where: { guildId_userId: { guildId, userId } },
          update: { score: { increment: 1 } },
          create: { guildId, userId, score: 1 }
        });
        
        // React with success emoji if accessible, else checkmark
        const successEmojiId = EMOJIS.success.match(/:(\d+)>/)?.[1];
        if (successEmojiId) {
          await message.react(successEmojiId).catch(() => message.react("✅").catch(() => null));
        } else {
          await message.react("✅").catch(() => null);
        }
      }
      return; // Don't allow command processing for number messages in counting channel
    }
  }

  // Automod check
  if (guildConfig && guildConfig.automodEnabled && guildConfig.blacklistedWords.length > 0) {
    const isWl = await isWhitelisted(message.guild!, userId) || guildConfig.automodWhitelist.includes(userId);
    if (!isWl) {
      const lowerContent = message.content.toLowerCase();
      const containsBlacklisted = guildConfig.blacklistedWords.some((word: string) => 
        lowerContent.includes(word.toLowerCase())
      );

      if (containsBlacklisted) {
        try {
          await message.delete();
          await (message.channel as any).send({
            embeds: [UniversalEmbed.error(`${message.author}, your message contained blacklisted words and was deleted.`, message.guild!)]
          }).then((msg: any) => setTimeout(() => msg.delete().catch(() => null), 5000));
        } catch {}
        return; // Halt execution
      }
    }
  }

  // 4. Command Resolution (Do this BEFORE auto-responders to make commands lightning fast)
  let hasPrefix = true;
  let commandString = "";

  if (message.content.startsWith(prefix)) {
    commandString = message.content.slice(prefix.length);
  } else {
    // Check if user has no-prefix enabled in this guild
    const isNoPrefix = await CacheService.getNoPrefix(guildId, message.author.id);

    if (isNoPrefix) {
      const tempArgs = message.content.trim().split(/ +/);
      const tempCommandName = tempArgs[0]?.toLowerCase();
      if (tempCommandName && CommandRegistry.get(tempCommandName)) {
        commandString = message.content;
        hasPrefix = false;
      }
    }
  }

  // If it's a command, execute it immediately and skip all chat-based DB queries (autoresponders, etc)
  if (commandString) {
    const args = commandString.trim().split(/ +/);
    const commandName = args.shift()?.toLowerCase();
    if (commandName) {
      const ctx = new CommandContext(message, args);
      ctx.prefix = hasPrefix ? prefix : "";
      ctx.commandName = commandName;
      await handleCommand(ctx, commandName);
      return; // Stop execution, it was a command
    }
  }

  // 5. Autoresponder check (Only runs if it wasn't a command)
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
      if ("send" in message.channel) {
        const parserCtx = {
          user: message.member ?? message.author,
          guild: message.guild,
          channelId: message.channel.id,
          channelName: (message.channel as any).name,
          prefix,
          message
        };

        // Parse Mimu placeholder variables
        const parsedText = parseVariables(ar.response, parserCtx);

        // Parse custom placeholders and functions
        const finalPayload = await parseFunctions(parsedText, guildId, parserCtx);

        // Send response and execute functional actions
        await executeSend(message.channel, finalPayload, message.member ?? message.author, message.guild, message);
      }
      return;
    }
  }

  // 6. AutoReact (Runs for normal chat)
  try {
    const autoReacts = await prisma.autoReact.findMany({ where: { guildId } });
    const lowerContent = message.content.toLowerCase();
    for (const ar of autoReacts) {
      if (lowerContent.includes(ar.trigger)) {
        for (const emoji of ar.emojis) {
          await message.react(emoji).catch(() => null);
        }
      }
    }
  } catch {}

  // 7. Sticky Message (Runs for normal chat)
  try {
    const sticky = await prisma.stickyMessage.findUnique({
      where: { channelId: message.channel.id }
    });

    if (sticky) {
      // Avoid infinite loop by ignoring bot's own sticky posts
      if (message.author.id !== message.client.user?.id) {
        if (sticky.lastMessageId) {
          try {
            const oldMsg = await message.channel.messages.fetch(sticky.lastMessageId);
            await oldMsg.delete();
          } catch {}
        }

        const sent = await (message.channel as any).send({
          embeds: [
            new UniversalEmbed("neutral", undefined, message.guild!)
              .setDescription(`📌 **Sticky Message**\n\n${sticky.message}`)
          ]
        });

        await prisma.stickyMessage.update({
          where: { channelId: message.channel.id },
          data: { lastMessageId: sent.id }
        });
      }
    }
  } catch {}
}
