import { Message, EmbedBuilder } from "discord.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleMessageUpdate(oldMessage: Message, newMessage: Message): Promise<void> {
  if (!newMessage.guild || newMessage.author?.bot) return;
  if (oldMessage.content === newMessage.content) return;

  const oldLen = oldMessage.content?.length || 0;
  const newLen = newMessage.content?.length || 0;
  const charDiff = newLen - oldLen;

  const embed = new EmbedBuilder()
    .setColor(0xf1c40f)
    .setAuthor({
      name: newMessage.author.tag,
      iconURL: newMessage.author.displayAvatarURL({ extension: "png" })
    })
    .setTitle("✏️ Message Edited")
    .setDescription(
      `> **User:** ${newMessage.author} (\`${newMessage.author.id}\`)\n` +
      `> **Channel:** ${newMessage.channel}\n` +
      `> **Length:** \`${oldLen}\` → \`${newLen}\` chars (${charDiff >= 0 ? `+${charDiff}` : charDiff})\n` +
      `> **[Jump to Message](${newMessage.url})**`
    )
    .addFields(
      {
        name: "📝 Before",
        value: oldMessage.content
          ? oldMessage.content.length > 1024 ? oldMessage.content.slice(0, 1018) + "..." : oldMessage.content
          : "*Empty / Unknown*"
      },
      {
        name: "📝 After",
        value: newMessage.content
          ? newMessage.content.length > 1024 ? newMessage.content.slice(0, 1018) + "..." : newMessage.content
          : "*Empty*"
      }
    )
    .setFooter({ text: `Message ID: ${newMessage.id}` })
    .setTimestamp();

  await sendGuildLog(newMessage.guild, "messages", embed);
}
