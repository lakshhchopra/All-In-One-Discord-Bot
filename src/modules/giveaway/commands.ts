import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  TextChannel
} from "discord.js";

export const gstartCommand: Command = {
  name: "gstart",
  description: "Start a giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const channel = ctx.getChannelOption("channel", 0) as TextChannel;
    const durationMin = ctx.getIntegerOption("duration", 1); // in minutes
    const winnerCount = ctx.getIntegerOption("winners", 2) ?? 1;
    const prize = ctx.args.slice(channel ? 3 : 2).join(" ") || ctx.getStringOption("prize", 3);

    if (!channel || !durationMin || !prize) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `gstart <channel> <duration_minutes> <winners> <prize>`", ctx.guild)] }, 5);
    }

    const endsAt = new Date(Date.now() + durationMin * 60000);

    const embed = new EmbedBuilder()
      .setTitle("🎉 GIVEAWAY 🎉")
      .setDescription(
        `**Prize:** ${prize}\n` +
        `**Winners:** ${winnerCount}\n` +
        `**Hosted By:** ${ctx.user}\n` +
        `**Ends At:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>`
      )
      .setColor(0x5865f2)
      .setTimestamp();

    const joinButton = new ButtonBuilder()
      .setCustomId("giveaway_join")
      .setLabel("Join (0)")
      .setEmoji("🎉")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

    const msg = await channel.send({ embeds: [embed], components: [row] });

    await prisma.giveaway.create({
      data: {
        id: msg.id, // messageId
        guildId: ctx.guild.id,
        channelId: channel.id,
        prize,
        winnerCount,
        endsAt,
        hostedBy: ctx.user.id
      }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Giveaway started in ${channel}!`, ctx.guild)] });
  }
};

export const gendCommand: Command = {
  name: "gend",
  description: "End a giveaway and choose winners.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const messageId = ctx.getStringOption("messageId", 0);
    if (!messageId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `gend <messageId>`", ctx.guild)] }, 5);

    const giveaway = await prisma.giveaway.findUnique({ where: { id: messageId } });
    if (!giveaway || giveaway.ended) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Giveaway not found or already ended.", ctx.guild)] }, 5);
    }

    const entries = giveaway.entries;
    if (entries.length === 0) {
      await prisma.giveaway.update({ where: { id: messageId }, data: { ended: true } });
      return ctx.reply({ embeds: [UniversalEmbed.warning("No entries in this giveaway, so no winners could be selected.", ctx.guild)] });
    }

    // Select random winners
    const winners: string[] = [];
    const tempEntries = [...entries];
    const winnersCount = Math.min(giveaway.winnerCount, tempEntries.length);

    for (let i = 0; i < winnersCount; i++) {
      const idx = Math.floor(Math.random() * tempEntries.length);
      winners.push(tempEntries.splice(idx, 1)[0]);
    }

    await prisma.giveaway.update({
      where: { id: messageId },
      data: { ended: true, winners }
    });

    // Update message
    try {
      const ch = await ctx.guild.channels.fetch(giveaway.channelId) as TextChannel;
      const msg = await ch.messages.fetch(messageId);
      
      const embed = EmbedBuilder.from(msg.embeds[0])
        .setDescription(`**Prize:** ${giveaway.prize}\n**Winners:** ${winners.map(id => `<@${id}>`).join(", ")}\n**Ended**`)
        .setColor(0x2f3136);

      await msg.edit({ embeds: [embed], components: [] });
      await ch.send(`🎉 Congratulations to the winners of **${giveaway.prize}**: ${winners.map(id => `<@${id}>`).join(", ")}!`);
    } catch {}

    return ctx.reply({ embeds: [UniversalEmbed.success("Giveaway ended and winners processed.", ctx.guild)] });
  }
};

export const grerollCommand: Command = {
  name: "greroll",
  description: "Reroll winners for an ended giveaway.",
  category: "Giveaway",
  permissionLevel: "MODERATOR",
  execute: async (ctx) => {
    const messageId = ctx.getStringOption("messageId", 0);
    if (!messageId) return ctx.reply({ embeds: [UniversalEmbed.error("Usage: `greroll <messageId>`", ctx.guild)] }, 5);

    const giveaway = await prisma.giveaway.findUnique({ where: { id: messageId } });
    if (!giveaway || !giveaway.ended) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Giveaway not found or not ended yet.", ctx.guild)] }, 5);
    }

    const entries = giveaway.entries;
    if (entries.length === 0) {
      return ctx.reply({ embeds: [UniversalEmbed.warning("No entries to choose from.", ctx.guild)] }, 5);
    }

    const winners: string[] = [];
    const tempEntries = [...entries];
    const winnersCount = Math.min(giveaway.winnerCount, tempEntries.length);

    for (let i = 0; i < winnersCount; i++) {
      const idx = Math.floor(Math.random() * tempEntries.length);
      winners.push(tempEntries.splice(idx, 1)[0]);
    }

    await prisma.giveaway.update({
      where: { id: messageId },
      data: { winners }
    });

    try {
      const ch = await ctx.guild.channels.fetch(giveaway.channelId) as TextChannel;
      await ch.send(`🎉 **Reroll:** Congratulations to the new winners of **${giveaway.prize}**: ${winners.map(id => `<@${id}>`).join(", ")}!`);
    } catch {}

    return ctx.reply({ embeds: [UniversalEmbed.success("Giveaway rerolled successfully.", ctx.guild)] });
  }
};

export function registerGiveaway() {
  CommandRegistry.register(gstartCommand);
  CommandRegistry.register(gendCommand);
  CommandRegistry.register(grerollCommand);
}
