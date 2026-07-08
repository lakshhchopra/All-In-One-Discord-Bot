import { Command } from "../../../commands/command.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, TextChannel } from "discord.js";
import { prisma } from "../../../services/db.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { parseDuration, DURATION_FORMAT_ERROR } from "../../../utils/duration.js";

export const gstartCommand: Command = {
  name: "gstart",
  description: "Start a giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  usage: "gstart <channel> <duration> <winners> <prize>",
  examples: [
    "gstart #giveaways 1h 1 Nitro Classic",
    "gstart #giveaways 30m 3 Discord Nitro",
    "gstart #giveaways 2d 1 Steam Gift Card"
  ],
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0) as TextChannel;
    const durationStr = ctx.getStringOption("duration", 1);
    const winnerCount = ctx.getIntegerOption("winners", 2) ?? 1;
    const prize = ctx.args.slice(3).join(" ") || ctx.getStringOption("prize", 3);

    if (!channel || !durationStr || !prize) {
      return ctx.reply({
        embeds: [UniversalEmbed.error(
          "Usage: `gstart <channel> <duration> <winners> <prize>`\nDuration examples: `30s`, `10m`, `2h`, `1d`",
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
      .setFooter({ text: "Click 🎉 to enter • Ends at" })
      .setTimestamp(endsAt);


    const joinButton = new ButtonBuilder()
      .setCustomId("giveaway_join")
      .setLabel("Join (0)")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

    const msg = await channel.send({ embeds: [embed], components: [row] });

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
