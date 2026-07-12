import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

export const variablesCommand: Command = {
  name: "variables",
  description: "Displays the guide for using placeholders and variables.",
  category: "Media",
  aliases: ["var", "vars", "placeholders"],
  execute: async (ctx) => {
    const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
      .setTitle("🤖 Bot Variables - Placeholders & Functions")
      .setDescription(
        "The below placeholders and variables are valid in the custom embed builder, autoresponder, autoreact, welcome/leave greetings, and sticky messages."
      )
      .addFields(
        {
          name: "Placeholders [1/3]\nUser & Settings",
          value: [
            "**User / Author Info**",
            "`{user}`",
            "`{user_tag}`",
            "`{user_name}`",
            "`{user_avatar}`",
            "`{user_discrim}`",
            "`{user_id}`",
            "`{user_nick}`",
            "`{user_joindate}`",
            "`{user_createdate}`",
            "`{user_displaycolor}`",
            "`{user_boostsince}`",
            "",
            "**Server Settings**",
            "`{server_prefix}`",
            "`{server_currency}`"
          ].join("\n"),
          inline: true
        },
        {
          name: "Placeholders [2/3]\nServer General Info",
          value: [
            "`{server_name}`",
            "`{server_id}`",
            "`{server_membercount}`",
            "`{server_membercount_nobots}`",
            "`{server_membercount_ordinal}`",
            "`{server_membercount_nobots_ordinal}`",
            "`{server_botcount}`",
            "`{server_botcount_ordinal}`",
            "`{server_icon}`",
            "`{server_rolecount}`",
            "`{server_channelcount}`",
            "`{server_randommember}`",
            "`{server_randommember_tag}`",
            "`{server_randommember_nobots}`",
            "`{server_owner}`",
            "`{server_owner_id}`",
            "`{server_createdate}`"
          ].join("\n"),
          inline: true
        },
        {
          name: "Placeholders [3/3]\nBoosts, Channels & Functions",
          value: [
            "**Server Boosts**",
            "`{server_boostlevel}`",
            "`{server_boostcount}`",
            "`{server_nextboostlevel}`",
            "`{server_nextboostlevel_required}`",
            "`{server_nextboostlevel_until_required}`",
            "",
            "**Channel & Msg Info**",
            "`{channel}`",
            "`{channel_name}`",
            "`{channel_createdate}`",
            "`{message_link}`",
            "`{message_id}`",
            "`{message_content}`",
            "",
            "**Others & Functions**",
            "`{date}`",
            "`{newline}`",
            "`{dm}`",
            "`{silent:}`",
            "`{delete}`",
            "`{sendto:channel_id}`",
            "`{delete_reply:N}`"
          ].join("\n"),
          inline: true
        }
      )
      .setFooter({ text: "Tip: Include {embed:name} anywhere to attach a saved embed!" });

    return ctx.reply({ embeds: [embed] });
  }
};
