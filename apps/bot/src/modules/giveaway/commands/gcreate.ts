import { Command } from "../../../commands/command.js";
import { EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../utils/duration.js";
import { EMOJIS } from "../../../config/emojis.js";

export const gcreateCommand: Command = {
  name: "gcreate",
  description: "Start a giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  usage: "gcreate <channel> <duration> <winners> <prize>",
  examples: [
    "gcreate #giveaways 1h 1 Nitro Classic",
    "gcreate #giveaways 30m 3 Discord Nitro",
    "gcreate #giveaways 2d 1 Steam Gift Card"
  ],
  execute: async (ctx: any) => {
    const channel = ctx.getChannelOption("channel", 0) as TextChannel;
    const durationStr = ctx.getStringOption("duration", 1);
    const winnerCount = ctx.getIntegerOption("winners", 2) ?? 1;
    const prize = ctx.args.slice(3).join(" ") || ctx.getStringOption("prize", 3);

    if (!channel || !durationStr || !prize) {
      return ctx.reply({
        embeds: [UniversalEmbed.error(
          "Usage: `gcreate <channel> <duration> <winners> <prize>`\nDuration examples: `30s`, `10m`, `2h`, `1d`",
          ctx.guild
        )]
      }, 5);
    }

    const parsed = parseDuration(durationStr);
    if (!parsed) {
      return ctx.reply({ embeds: [UniversalEmbed.error(DURATION_FORMAT_ERROR, ctx.guild)] }, 5);
    }

    const endsAt = new Date(Date.now() + parsed.ms);

    const serverIcon = ctx.guild.iconURL({ extension: "png", size: 256 }) ?? null;

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY 🎉")
      .setDescription(
        `**Prize:** ${prize}\n` +
        `**Winners:** ${winnerCount}\n` +
        `**Duration:** ${parsed.label}\n` +
        `**Hosted By:** ${ctx.user}\n` +
        `**Ends:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`
      )
      .setColor(0x5865f2)
      .setThumbnail(serverIcon)
      .setFooter({ text: "React to enter • Ends at" })
      .setTimestamp(endsAt);

    const msg = await channel.send({ embeds: [embed] });
    await msg.react(EMOJIS.gwy);

    await prisma.giveaway.create({
      data: {
        id: msg.id,
        guildId: ctx.guild.id,
        channelId: channel.id,
        prize,
        winnerCount,
        endsAt,
        hostedBy: ctx.user.id
      }
    });

    return ctx.reply({
      embeds: [UniversalEmbed.success(`Giveaway started in ${channel} for **${parsed.label}**!`, ctx.guild)]
    });
  }
};

