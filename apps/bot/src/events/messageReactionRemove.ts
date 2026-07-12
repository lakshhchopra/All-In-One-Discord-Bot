import { MessageReaction, User, PartialMessageReaction, PartialUser } from "discord.js";
import { prisma } from "../services/db.js";
import { EMOJIS } from "../config/emojis.js";

const getGwyEmojiInfo = () => {
  const gwy = EMOJIS.gwy;
  const match = gwy.match(/:(\d+)>/);
  if (match) {
    return { isCustom: true, identifier: match[1] };
  }
  return { isCustom: false, identifier: gwy };
};

export async function handleMessageReactionRemove(
  reaction: MessageReaction | PartialMessageReaction,
  user: User | PartialUser
) {
  if (reaction.partial) {
    try {
      await reaction.fetch();
    } catch (error) {
      console.error("Failed to fetch partial reaction:", error);
      return;
    }
  }
  if (user.partial) {
    try {
      await user.fetch();
    } catch (error) {
      console.error("Failed to fetch partial user:", error);
      return;
    }
  }

  if (user.bot) return;

  const emojiInfo = getGwyEmojiInfo();
  const isMatch = emojiInfo.isCustom
    ? reaction.emoji.id === emojiInfo.identifier
    : reaction.emoji.name === emojiInfo.identifier;

  if (!isMatch) return;

  const msgId = reaction.message.id;
  const userId = user.id;

  const giveaway = await prisma.giveaway.findUnique({ where: { id: msgId } });
  if (!giveaway || giveaway.ended) return;

  let entries = giveaway.entries as string[];
  if (entries.includes(userId)) {
    entries = entries.filter(id => id !== userId);
    await prisma.giveaway.update({
      where: { id: msgId },
      data: { entries }
    });
  }
}
