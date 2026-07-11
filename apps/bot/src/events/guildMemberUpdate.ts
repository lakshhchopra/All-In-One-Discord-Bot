import { GuildMember } from "discord.js";
import { prisma } from "../services/db.js";
import { parseVariables } from "../services/utils/parser.js";
import { parseFunctions, executeSend } from "../services/utils/placeholder.js";

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
          const parserCtx = { user: newMember, guild };
          const parsedMessage = parseVariables(template, parserCtx);
          const finalPayload = await parseFunctions(parsedMessage, guild.id, parserCtx);
          await executeSend(ch, finalPayload, newMember, guild);
        }
      }
    } catch (err) {
      console.error("Failed to process boost greeting:", err);
    }
  }
}
