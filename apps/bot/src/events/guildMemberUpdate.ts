import { GuildMember } from "discord.js";
import { prisma } from "../services/db.js";

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
          const parsed = template
            .replace("{user}", newMember.user.toString())
            .replace("{server}", guild.name);
          await (ch as any).send({ content: parsed });
        }
      }
    } catch (err) {
      console.error("Failed to process boost greeting:", err);
    }
  }
}
