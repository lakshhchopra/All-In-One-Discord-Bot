import { GuildMember } from "discord.js";
import { prisma } from "../services/db.js";
import { parseVariables, parseObjectVariables } from "../services/utils/parser.js";
import { parseEmbedPlaceholder } from "../services/utils/placeholder.js";

export async function handleGuildMemberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
  const guild = newMember.guild;

  // Boost Detection
  const oldPremium = oldMember.premiumSince;
  const newPremium = newMember.premiumSince;

  if (!oldPremium && newPremium) {
    try {
      const config = await prisma.guildConfig.findUnique({
        where: { guildId: guild.id }
      });

      if (config && config.boostChannelId) {
        const ch = guild.channels.cache.get(config.boostChannelId);
        if (ch && "send" in ch) {
          const template = config.boostMessage || "Thanks {user} for boosting {server}!";
          const parsedMessage = parseVariables(template, { user: newMember, guild });

          let sendPayload: any = {};

          if (parsedMessage.includes("{embed:") || parsedMessage.includes("{EMBED:")) {
            const res = await parseEmbedPlaceholder(parsedMessage, guild.id);
            let embeds = res.embeds || [];
            if (embeds.length > 0) {
              embeds = embeds.map(emb => parseObjectVariables(emb, { user: newMember, guild }));
            }
            sendPayload = {
              content: res.content || undefined,
              embeds
            };
          } else {
            sendPayload = { content: parsedMessage };
          }

          await (ch as any).send(sendPayload);
        }
      }
    } catch (err) {
      console.error("Failed to process boost greeting:", err);
    }
  }
}
