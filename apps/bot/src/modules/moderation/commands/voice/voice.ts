import { Command } from "../../../../commands/command.js";
import { UniversalEmbed } from "../../../../services/embed.js";

export const voiceCommand: Command = {
  name: "voice",
  description: "Moderates members in voice channels.",
  category: "Moderation",
  permissionLevel: "MODERATOR",
  usage: "voice <mute | unmute | deafen | undeafen | kick> <@member>",
  examples: [
    "voice mute @member",
    "voice kick @member",
    "voice undeafen @member"
  ],
  execute: async (ctx) => {
    const action = ctx.getStringOption("action", 0)?.toLowerCase();
    const target = ctx.getMemberOption("member", 1);

    if (!action || !target) {
      return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `voice <mute | unmute | deafen | undeafen | kick> <@member>`", ctx.guild)] });
    }

    if (!target.voice.channel) {
      return ctx.reply({ embeds: [UniversalEmbed.error(`${target.user.tag} is not connected to a voice channel.`, ctx.guild)] }, 5);
    }

    if (action === "mute") {
      await target.voice.setMute(true, "Moderation voice mute command.");
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice muted **${target.user.tag}**.`, ctx.guild)] });
    }

    if (action === "unmute") {
      await target.voice.setMute(false, "Moderation voice unmute command.");
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice unmuted **${target.user.tag}**.`, ctx.guild)] });
    }

    if (action === "deafen") {
      await target.voice.setDeaf(true, "Moderation voice deafen command.");
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice deafened **${target.user.tag}**.`, ctx.guild)] });
    }

    if (action === "undeafen") {
      await target.voice.setDeaf(false, "Moderation voice undeafen command.");
      return ctx.reply({ embeds: [UniversalEmbed.success(`Voice undeafened **${target.user.tag}**.`, ctx.guild)] });
    }

    if (action === "kick") {
      await target.voice.disconnect("Moderation voice disconnect command.");
      return ctx.reply({ embeds: [UniversalEmbed.success(`Disconnected **${target.user.tag}** from voice channel.`, ctx.guild)] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `voice <mute | unmute | deafen | undeafen | kick> <@member>`", ctx.guild)] });
  }
};
