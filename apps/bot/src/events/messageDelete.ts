import { EmbedBuilder } from "discord.js";
import { sendGuildLog } from "../services/logger.js";

export async function handleMessageDelete(message: any): Promise<void> {
  if (!message.guild || !message.author || message.author.bot) return;

  const embed = new EmbedBuilder()
    .setColor(0xe74c3c)
    .setAuthor({
      name: message.author.tag,
      iconURL: message.author.displayAvatarURL({ extension: "png" })
    })
    .setTitle("🗑️ Message Deleted")
    .setDescription(
      `> **User:** ${message.author} (\`${message.author.id}\`)\n` +
      `> **Channel:** ${message.channel}\n` +
      `> **Sent:** <t:${Math.floor(message.createdTimestamp / 1000)}:f> (<t:${Math.floor(message.createdTimestamp / 1000)}:R>)`
    )
    .addFields({
      name: "📄 Content",
      value: message.content
        ? message.content.length > 1024
          ? message.content.slice(0, 1018) + "..."
          : message.content
        : "*No text content (embed or attachment only)*"
    })
    .setFooter({ text: `Message ID: ${message.id}` })
    .setTimestamp();

  if (message.attachments && message.attachments.size > 0) {
    embed.addFields({
      name: "📎 Attachments",
      value: message.attachments.map((a: any) => `[${a.name}](${a.url})`).join("\n")
    });
  }

  await sendGuildLog(message.guild, "messages", embed);
}
