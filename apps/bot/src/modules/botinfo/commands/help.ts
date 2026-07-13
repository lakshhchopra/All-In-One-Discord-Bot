import { Command, CommandRegistry } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { EMOJIS, parseEmoji } from "../../../config/emojis.js";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, Guild } from "discord.js";

export const COMMAND_USAGES: Record<string, string> = {
  setprefix: "setprefix <new_prefix>",
  noprefix: "noprefix <enable | disable | list> [member]",
  config: "config",
  uptime: "uptime",
  help: "help [command]",
  greet: "greet <enable | disable | create | channel | delete | config | style | card | autodelete | test>",
  leavemsg: "leavemsg <enable | disable | set | show | reset | test>",
  boostgreet: "boostgreet <enable | disable | set | show | reset | test>",
  autorole: "autorole <enable | disable | show | humans | bots>",
  embed: "embed <create | edit | import | export | save | delete | show | send | rename>",
  variables: "variables",
  reactionrole: "reactionrole <add | remove | show | addmany | format | info | edit | clone | maxroles | clear>",
  autoresponder: "autoresponder <add | remove | show | editreply | reset | rename>",
  autoreact: "autoreact <add | remove | show | rename | editemojis | reset>",
  sticky: "sticky <add | remove | show | bump | reset | channel>",
  tempvc: "tempvc <setup | name | limit | lock | unlock | region | hide | unhide | trust | untrust | kick | block | claim | transfer | sendpanel | generator>",
  ticket: "ticket <setup | setrole @role | reopen | transcript | greetmsg | category | type | delete | rename | add | support | remove | close | logging | list | panel>",
  message: "message [member]",
  invites: "invites [member]",
  dailymessage: "dailymessage [member]",
  gcreate: "gcreate <channel> <duration> <winners> <prize>",
  gend: "gend <messageId>",
  greroll: "greroll <messageId>",
  gresume: "gresume <messageId>",
  gpause: "gpause <messageId>",
  gparticipants: "gparticipants <messageId>",
  logging: "logging <enable | disable | setctchannel>",
  count: "count [member]",
  counting: "counting <channel | show | reset> [#channel]",
  lb: "lb <count | messages | invites | dailymessage>",
  ship: "ship <@user1> [@user2]",
  afk: "afk [message]",
  membercount: "membercount",
  boostcount: "boostcount",
  joinedat: "joinedat [member]",
  serverinfo: "serverinfo",
  userinfo: "userinfo [member]",
  channelinfo: "channelinfo [channel]",
  roleinfo: "roleinfo <@role>",
  avatar: "avatar [member]",
  banner: "banner [member]",
  servericon: "servericon",
  serverbanner: "serverbanner",
  profile: "profile [member]",
  vote: "vote",
  list: "list <mods | admins | bots | timeouts | bans | channels | roles | users | emojis | createdat | joinedat | boosters>"
};

export const TEMPVC_DESCRIPTIONS: Record<string, string> = {
  "tempvc setup": "Automatically setup a voice channel category, generator voice channel, and interface text channel with the controller panel.",
  "tempvc lock": "Lock the temporary voice channel so only trusted users can connect.",
  "tempvc unlock": "Unlock the temporary voice channel for everyone.",
  "tempvc hide": "Hide the temporary voice channel from the channel list.",
  "tempvc unhide": "Unhide the temporary voice channel to make it visible to everyone.",
  "tempvc uhide": "Unhide the temporary voice channel to make it visible to everyone.",
  "tempvc rename": "Change the name of your temporary voice channel.",
  "tempvc name": "Change the name of your temporary voice channel.",
  "tempvc limit": "Change the user limit of your temporary voice channel.",
  "tempvc trust": "Add a user to the trusted list so they can join even when locked.",
  "tempvc untrust": "Remove a user from the trusted list.",
  "tempvc kick": "Disconnect a member from your temporary voice channel.",
  "tempvc transfer": "Transfer ownership of your temporary voice channel to another member.",
  "tempvc claim": "Claim ownership of the temporary voice channel if the current owner is no longer in it.",
  "tempvc region": "Change the voice channel RTC region.",
  "tempvc block": "Block a user from connecting to your temporary voice channel.",
  "tempvc sendpanel": "Post the persistent interactive controller panel to a text channel.",
  "tempvc generator": "Manage voice generators (add, remove, list)."
};

export const CATEGORY_DETAILS: Record<string, string> = {
  antinuke_automod: 
    `> **Automod**\n` +
    `\`automod\`, \`automod settings\`, \`automod whitelist\`, \`automod reset\`, \`automod enable\`, \`automod wlshow\`, \`automod disable\`, \`automod logging\`, \`automod manage\`\n\n` +
    `> **Word Blacklist**\n` +
    `\`blword\`, \`blword add\`, \`blword guide\`, \`blword show\`, \`blword remove\`, \`blword reset\``,

  security:
    `> **Antinuke**\n` +
    `\`antinuke\`, \`antinuke reset\`, \`antinuke whitelist\`, \`antinuke wallon\`, \`antinuke autorecovery\`, \`antinuke trustlimit\`, \`antinuke manage\`, \`antinuke walloff\`, \`antinuke disable\`, \`antinuke logging\`, \`antinuke enable\`, \`antinuke logdisable\`, \`antinuke betrayalguard\`, \`antinuke limit\`, \`antinuke zplus\`, \`antinuke wizard\`\n\n` +
    `> **Mainrole**\n` +
    `\`mainrole\`, \`mainrole reset\`, \`mainrole show\`, \`mainrole add\`, \`mainrole remove\`\n\n` +
    `> **Panicmode**\n` +
    `\`panicmode\`, \`panicmode enable\`, \`panicmode reset\`, \`panicmode setup\`, \`panicmode disable\`, \`panicmode show\`\n\n` +
    `> **Extraowner**\n` +
    `\`extraowner\`, \`extraowner remove\`, \`extraowner reset\`, \`extraowner add\`, \`extraowner show\`\n\n` +
    `> **Trusted**\n` +
    `\`trusted\`, \`trusted reset\`, \`trusted show\`, \`trusted add\`, \`trusted remove\`\n\n` +
    `> **Ignore**\n` +
    `\`ignore\`, \`ignore bypass\`, \`ignore bypass add\`, \`ignore bypass reset\`, \`ignore bypass show\`, \`ignore bypass remove\`, \`ignore role\`, \`ignore role reset\`, \`ignore role remove\`, \`ignore role add\`, \`ignore role show\`, \`ignore command\`, \`ignore command remove\`, \`ignore command add\`, \`ignore command reset\`, \`ignore command show\`, \`ignore user\`, \`ignore user reset\`, \`ignore user show\`, \`ignore user remove\`, \`ignore user add\`, \`ignore channel\`, \`ignore channel remove\`, \`ignore channel reset\`, \`ignore channel add\`, \`ignore channel show\``,

  welcomer:
    `> **Welcome**\n` +
    `\`greet\`, \`greet enable\`, \`greet disable\`, \`greet create\`, \`greet channel\`, \`greet channel reset\`, \`greet channel set\`, \`greet delete\`, \`greet config\`, \`greet style\`, \`greet card\`, \`greet autodelete\`, \`greet test\`\n\n` +
    `> **Leave Msg**\n` +
    `\`leavemsg\`, \`leavemsg reset\`, \`leavemsg disable\`, \`leavemsg show\`, \`leavemsg test\`, \`leavemsg enable\`, \`leavemsg set\`\n\n` +
    `> **Boost**\n` +
    `\`boostgreet\`, \`boostgreet set\`, \`boostgreet disable\`, \`boostgreet show\`, \`boostgreet enable\`, \`boostgreet test\`, \`boostgreet reset\`\n\n` +
    `> **Auto Roles**\n` +
    `\`autorole\`, \`autorole show\`, \`autorole enable\`, \`autorole disable\`, \`autorole humans\`, \`autorole humans enable\`, \`autorole humans show\`, \`autorole humans disable\`, \`autorole humans add\`, \`autorole humans reset\`, \`autorole humans remove\`, \`autorole bots\`, \`autorole bots enable\`, \`autorole bots disable\`, \`autorole bots add\`, \`autorole bots remove\`, \`autorole bots show\`, \`autorole bots reset\``,

  embed_system:
    `> **Embed Commands**\n` +
    `\`embed\`, \`embed edit\`, \`embed import\`, \`embed save\`, \`embed export\`, \`embed create\`, \`embed list\`, \`embed delete\`, \`embed show\`, \`embed send\`, \`embed rename\`, \`variables\``,

  utility:
    `> **Reaction Role**\n` +
    `\`reactionrole\`, \`reactionrole addmany\`, \`reactionrole format\`, \`reactionrole remove\`, \`reactionrole info\`, \`reactionrole show\`, \`reactionrole add\`, \`reactionrole edit\`, \`reactionrole clone\`, \`reactionrole maxroles\`, \`reactionrole clear\`\n\n` +
    `> **Auto Responders**\n` +
    `\`autoresponder\`, \`autoresponder editreply\`, \`autoresponder add\`, \`autoresponder remove\`, \`autoresponder reset\`, \`autoresponder show\`, \`autoresponder rename\`\n\n` +
    `> **Auto Reactors**\n` +
    `\`autoreact\`, \`autoreact rename\`, \`autoreact remove\`, \`autoreact editemojis\`, \`autoreact add\`, \`autoreact reset\`, \`autoreact show\`\n\n` +
    `> **Sticky Message**\n` +
    `\`sticky\`, \`sticky show\`, \`sticky add\`, \`sticky bump\`, \`sticky reset\`, \`sticky remove\`, \`sticky channel\`, \`sticky channel remove\`, \`sticky channel add\``,

  voice_master:
    `> **Temp Voice**\n` +
    `\`tempvc setup\`, \`tempvc name\`, \`tempvc limit\`, \`tempvc lock\`, \`tempvc unlock\`, \`tempvc region\`, \`tempvc hide\`, \`tempvc unhide\`, \`tempvc trust\`, \`tempvc untrust\`, \`tempvc kick\`, \`tempvc block\`, \`tempvc claim\`, \`tempvc transfer\`, \`tempvc sendpanel\`, \`tempvc generator\``,

  bot_info:
    `> **Bot Info Commands**\n` +
    `\`prefix\`, \`prefix set\`, \`prefix reset\`, \`prefix add\`, \`prefix show\`, \`prefix remove\`, \`noprefix enable|disable|list\`, \`info\`, \`status\`, \`ping\`, \`botinfo\`, \`uptime\`, \`aboutdev\``,

  ticket:
    `> **Ticket Commands**\n` +
    `\`ticket\`, \`ticket reopen\`, \`ticket transcript\`, \`ticket greetmsg\`, \`ticket category\`, \`ticket type\`, \`ticket type create\`, \`ticket type edit\`, \`ticket type delete\`, \`ticket delete\`, \`ticket rename\`, \`ticket add\`, \`ticket support\`, \`ticket support add\`, \`ticket support reset\`, \`ticket support show\`, \`ticket support remove\`, \`ticket remove\`, \`ticket autotranscript\`, \`ticket close\`, \`ticket logging\`, \`ticket list\`, \`ticket maxtickets\`, \`ticket panel\``,

  messagings_invites:
    `> **Messaging & Invites**\n` +
    `\`message\`, \`invites\`, \`dailymessage\`, \`lb messages\`, \`lb invites\`, \`lb dailymessage\`, \`message reset\`, \`invite reset\`, \`message add\`, \`invites add\``,

  moderation:
    `> **Basic Commands**\n` +
    `\`ban\`, \`fakeban\`, \`softban\`, \`kick\`, \`mute\`, \`unmute\`, \`unban\`, \`nick\`, \`clone\`, \`nuke\`, \`hideall\`, \`unhideall\`, \`lockall\`, \`unlockall\`, \`unbanall\`, \`lock\`, \`unlock\`, \`hide\`, \`unhide\`, \`slowmode\`, \`unslowmode\`, \`channel\`, \`channel create\`, \`channel deleteafter\`, \`channel transfer\`, \`channel rename\`, \`channel delete\`, \`enlarge\`, \`steal\`, \`deleteemoji\`, \`deletesticker\`, \`snipe\`\n\n` +
    `> **Role Commands**\n` +
    `\`role\`, \`role create\`, \`role colour\`, \`role taskcancel\`, \`role remove\`, \`role bots\`, \`role rename\`, \`role icon\`, \`role add\`, \`role delete\`, \`role humans\`, \`role all\`, \`rrole\`, \`rrole bots\`, \`rrole humans\`, \`rrole all\`\n\n` +
    `> **Purge Commands**\n` +
    `\`clear\`, \`clear bots\`, \`clear image\`, \`clear reactions\`, \`clear contain\`, \`clear embed\`, \`clear mentions\`, \`clear emoji\`, \`clear files\`, \`clear all\`, \`clear user\`, \`purgeuser\`, \`purgebots\`\n\n` +
    `> **Quarantine Commands**\n` +
    `\`quarantine\`, \`quarantine reset\`, \`quarantine remove\`, \`quarantine setup\`, \`quarantine show\`, \`quarantine config\`, \`quarantine add\`, \`unquarantine\`\n\n` +
    `> **Voice Commands**\n` +
    `\`voice\`, \`voice unprivate\`, \`voice undeafenall\`, \`voice deafen\`, \`voice muteall\`, \`voice moveall\`, \`voice kickall\`, \`voice pullall\`, \`voice private\`, \`voice deafenall\`, \`voice move\`, \`voice unmute\`, \`voice unmuteall\`, \`voice lock\`, \`voice pull\`, \`voice undeafen\`, \`voice kick\`, \`voice unlock\`, \`voice mute\`\n\n` +
    `> **VC Roles**\n` +
    `\`vcrole\`, \`vcrole set\`, \`vcrole enable\`, \`vcrole disable\`, \`vcrole show\`, \`vcrole reset\``,

  general_commands:
    `> **Basic Commands**\n` +
    `\`afk\`, \`membercount\`, \`boostcount\`, \`joinedat\`, \`serverinfo\`, \`userinfo\`, \`channelinfo\`, \`roleinfo\`, \`avatar\`, \`banner\`, \`servericon\`, \`serverbanner\`, \`profile\`, \`vote\`\n\n` +
    `> **List Commands**\n` +
    `\`list\`, \`list mods\`, \`list activedeveloper\`, \`list pending\`, \`list inrole\`, \`list roles\`, \`list users\`, \`list emojis\`, \`list createdat\`, \`list channels\`, \`list bans\`, \`list hasperms\`, \`list invoice\`, \`list early\`, \`list hypesquad\`, \`list admins\`, \`list bots\`, \`list bughunters\`, \`list timeouts\`, \`list joinedat\`, \`list boosters\``,

  giveaways:
    `> **Giveaway Commands**\n` +
    `\`gcreate\`, \`greroll\`, \`gend\`, \`gresume\`, \`gpause\`, \`gparticipants\``,

  loggings:
    `> **Logging Commands**\n` +
    `\`logging\`, \`logging setctchannel\`, \`loggings config\`, \`loggings info\``,

  mini_games:
    `> **Counting**\n` +
    `\`counting channel\`, \`lb count\`, \`count\`\n\n` +
    `> **Ship**\n` +
    `\`ship\`, \`ship random\`, \`hate\`, \`love\`, \`friendship\``,

  music:
    `> **Music Commands**\n` +
    `\`play\`, \`pause\`, \`resume\`, \`stop\`, \`skip\`, \`queue\`, \`nowplaying\`, \`volume\`, \`forward\`, \`rewind\`, \`loop\`, \`join\`, \`247\``
};

export function resolveStandardCategoryName(input: string): string | null {
  const norm = input.toLowerCase().trim();
  if (norm === "antinuke_automod" || norm === "antinuke & automod") return "Antinuke & Automod";
  if (norm === "security") return "Security";
  if (norm === "welcomer" || norm === "welcomer module") return "Welcomer Module";
  if (norm === "embed_system" || norm === "embed system") return "Embed System";
  if (norm === "utility") return "Utility";
  if (norm === "voice_master" || norm === "voice master") return "Voice Master";
  if (norm === "bot_info" || norm === "bot info") return "Bot Info";
  if (norm === "ticket") return "Ticket";
  if (norm === "messagings_invites" || norm === "messagings & invites") return "Messagings & Invites";
  if (norm === "moderation") return "Moderation";
  if (norm === "general_commands" || norm === "general commands") return "General Commands";
  if (norm === "giveaways") return "Giveaways";
  if (norm === "loggings") return "Loggings";
  if (norm === "mini_games" || norm === "mini games") return "Mini Games";
  if (norm === "music") return "Music";
  return null;
}

export function resolveCategory(input: string): string | null {
  const norm = input.toLowerCase().trim();
  if (norm === "antinuke" || norm === "automod" || norm === "anti raid" || norm === "antiraid" || norm === "antinuke & automod" || norm === "antinuke_automod") return "antinuke_automod";
  if (norm === "sec" || norm === "security") return "security";
  if (norm === "welcomer" || norm === "welcome" || norm === "welcomer module") return "welcomer";
  if (norm === "embed" || norm === "embeds" || norm === "embed system" || norm === "embed_system") return "embed_system";
  if (norm === "utility" || norm === "utilities") return "utility";
  if (norm === "tempvc" || norm === "voice master" || norm === "voice_master" || norm === "temp voice") return "voice_master";
  if (norm === "info" || norm === "botinfo" || norm === "bot info" || norm === "bot_info" || norm === "status" || norm === "ping") return "bot_info";
  if (norm === "ticket" || norm === "tickets") return "ticket";
  if (norm === "messages" || norm === "invites" || norm === "messagings" || norm === "messagings_invites" || norm === "messagings & invites") return "messagings_invites";
  if (norm === "moderation" || norm === "mod" || norm === "basic moderation") return "moderation";
  if (norm === "general" || norm === "general commands" || norm === "general_commands") return "general_commands";
  if (norm === "giveaways" || norm === "giveaway") return "giveaways";
  if (norm === "loggings" || norm === "logging" || norm === "logs") return "loggings";
  if (norm === "mini games" || norm === "mini_games" || norm === "minigames" || norm === "games") return "mini_games";
  if (norm === "music" || norm === "song" || norm === "audio") return "music";
  return null;
}

export function getCommandsForOption(optionValue: string): string[] {
  const detailText = CATEGORY_DETAILS[optionValue as keyof typeof CATEGORY_DETAILS] || "";
  if (!detailText) return [];

  if (optionValue === "voice_master") {
    return [
      "tempvc setup",
      "tempvc name",
      "tempvc limit",
      "tempvc lock",
      "tempvc unlock",
      "tempvc region",
      "tempvc hide",
      "tempvc unhide",
      "tempvc trust",
      "tempvc untrust",
      "tempvc kick",
      "tempvc block",
      "tempvc claim",
      "tempvc transfer",
      "tempvc sendpanel",
      "tempvc generator"
    ];
  }

  const cmdRegex = /`([^`]+)`/g;
  const cmds: string[] = [];
  let match;
  while ((match = cmdRegex.exec(detailText)) !== null) {
    if (!cmds.includes(match[1])) {
      cmds.push(match[1]);
    }
  }
  return cmds;
}

export function getCommandModule(category: string): string {
  const catLower = category.toLowerCase();
  if (catLower === "antinuke & automod") return "antinuke";
  if (catLower === "security") return "settings";
  if (catLower === "welcomer module") return "welcomer";
  if (catLower === "embed system") return "media";
  if (catLower === "utility") return "settings";
  if (catLower === "voice master") return "voicemaster";
  if (catLower === "bot info") return "info";
  if (catLower === "ticket") return "pad";
  if (catLower === "messagings & invites") return "bottle";
  if (catLower === "moderation") return "moderation";
  if (catLower === "general commands") return "settings";
  if (catLower === "giveaways") return "giveaway";
  if (catLower === "loggings") return "module";
  if (catLower === "mini games") return "gwy";
  if (catLower === "music") return "voice";
  return "settings";
}

export function getHelpComponents(userId: string) {
  const buttonsRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`help:home:${userId}`)
      .setEmoji(parseEmoji(EMOJIS.home) as any)
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`help:delete:${userId}`)
      .setEmoji(parseEmoji(EMOJIS.dustbin) as any)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`help:all:${userId}`)
      .setLabel("All Commands")
      .setEmoji(parseEmoji(EMOJIS.pad) as any)
      .setStyle(ButtonStyle.Secondary)
  );

  const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId(`help:category:${userId}`)
      .setPlaceholder("Choose a Category")
      .addOptions([
        { label: "Antinuke & Automod", value: "antinuke_automod", description: "Automod & Word Blacklist systems", emoji: parseEmoji(EMOJIS.antinuke) as any },
        { label: "Security", value: "security", description: "Antinuke, mainrole, panicmode, extraowner", emoji: parseEmoji(EMOJIS.settings) as any },
        { label: "Welcomer Module", value: "welcomer", description: "Welcomer, Leave, Boost & Auto Roles", emoji: parseEmoji(EMOJIS.welcomer) as any },
        { label: "Embed System", value: "embed_system", description: "Embed creator and variables", emoji: parseEmoji(EMOJIS.media) as any },
        { label: "Utility", value: "utility", description: "Reaction roles, sticky msgs, autoresponder", emoji: parseEmoji(EMOJIS.settings) as any },
        { label: "Voice Master", value: "voice_master", description: "Temporary voice channel creator", emoji: parseEmoji(EMOJIS.voicemaster) as any },
        { label: "Bot Info", value: "bot_info", description: "Bot information, prefix & ping", emoji: parseEmoji(EMOJIS.info) as any },
        { label: "Ticket", value: "ticket", description: "Support ticket configuration & transcripts", emoji: parseEmoji(EMOJIS.pad) as any },
        { label: "Messagings & Invites", value: "messagings_invites", description: "Message counts and invite leaderboards", emoji: parseEmoji(EMOJIS.bottle) as any },
        { label: "Moderation", value: "moderation", description: "Quarantines, VC roles, purges & bans", emoji: parseEmoji(EMOJIS.moderation) as any },
        { label: "General Commands", value: "general_commands", description: "Serverinfo, userinfo & member list", emoji: parseEmoji(EMOJIS.settings) as any },
        { label: "Giveaways", value: "giveaways", description: "Host, reroll & manage server giveaways", emoji: parseEmoji(EMOJIS.giveaway) as any },
        { label: "Loggings", value: "loggings", description: "Action logging configuration", emoji: parseEmoji(EMOJIS.module) as any },
        { label: "Mini Games", value: "mini_games", description: "Counting game and ship compatibility", emoji: parseEmoji(EMOJIS.gwy) as any },
        { label: "Music", value: "music", description: "Play and manage voice channel music", emoji: parseEmoji(EMOJIS.voice) as any }
      ])
  );

  return [buttonsRow, selectRow];
}

export function getHomeEmbed(prefix: string, guild?: Guild) {
  const totalCmds = CommandRegistry.getAll().length;
  const clientUser = guild?.client.user;
  const avatarUrl = clientUser?.displayAvatarURL({ extension: "png", size: 1024 }) || null;
  const clientName = clientUser?.username || "Gupshup";

  const embed = new UniversalEmbed("neutral", undefined, guild)
    .setThumbnail(avatarUrl)
    .setDescription(
      `### ${EMOJIS.info} Hey , I'm ${clientName}\n\n` +
      `- **My prefix for this server is:** \`${prefix}\`\n` +
      `- **Type \`${prefix}help [context]\` for more**\n` +
      `- **Total commands:** \`${totalCmds}\`\n\n` +
      `## ${EMOJIS.module} Modules\n` +
      `${EMOJIS.antinuke}・**Antinuke & Automod**\n` +
      `${EMOJIS.settings}・**Security**\n` +
      `${EMOJIS.welcomer}・**Welcomer Module**\n` +
      `${EMOJIS.media}・**Embed System**\n` +
      `${EMOJIS.settings}・**Utility**\n` +
      `${EMOJIS.voicemaster}・**Voice Master**\n` +
      `${EMOJIS.info}・**Bot Info**\n` +
      `${EMOJIS.pad}・**Ticket**\n` +
      `${EMOJIS.bottle}・**Messagings & Invites**\n` +
      `${EMOJIS.moderation}・**Moderation**\n` +
      `${EMOJIS.settings}・**General Commands**\n` +
      `${EMOJIS.giveaway}・**Giveaways**\n` +
      `${EMOJIS.module}・**Loggings**\n` +
      `${EMOJIS.gwy}・**Mini Games**\n` +
      `${EMOJIS.voice}・**Music**\n\n` +
      `🔗 **Links**\n` +
      `[Support](https://discord.gg/gupshup)`
    );
  return embed;
}

export function getCategoryEmbed(categoryName: string, prefix: string, guild?: Guild) {
  const stdName = resolveStandardCategoryName(categoryName) || categoryName;
  const detailText = CATEGORY_DETAILS[categoryName as keyof typeof CATEGORY_DETAILS] || "No commands in this category.";

  const emoji = EMOJIS[getCommandModule(stdName) as keyof typeof EMOJIS] || EMOJIS.settings;

  const embed = new UniversalEmbed("neutral", undefined, guild)
    .setTitle(`${emoji}・${stdName}`)
    .setDescription(detailText);

  return embed;
}

export function getAllCommandsEmbed(prefix: string, guild?: Guild): UniversalEmbed[] {
  const embeds: UniversalEmbed[] = [];
  let currentEmbed = new UniversalEmbed("neutral", undefined, guild)
    .setTitle("All Commands (Page 1)");
  let currentEmbedCharCount = currentEmbed.data.title!.length;

  const categoriesList = [
    "antinuke_automod",
    "security",
    "welcomer",
    "embed_system",
    "utility",
    "voice_master",
    "bot_info",
    "ticket",
    "messagings_invites",
    "moderation",
    "general_commands",
    "giveaways",
    "loggings",
    "mini_games",
    "music"
  ];

  let pageNum = 1;

  for (const cat of categoriesList) {
    const stdName = resolveStandardCategoryName(cat) || cat;
    const detailText = CATEGORY_DETAILS[cat as keyof typeof CATEGORY_DETAILS];
    if (detailText) {
      const cmdRegex = /`([^`]+)`/g;
      const cmds: string[] = [];
      let match;
      while ((match = cmdRegex.exec(detailText)) !== null) {
        const fullCmd = match[1]; // Keep full command including subcommands
        if (!cmds.includes(fullCmd)) {
          cmds.push(fullCmd);
        }
      }
      
      if (cmds.length > 0) {
        const formattedCmds = cmds.map(c => `\`${c}\``);
        let currentFieldVal = "";
        let partIndex = 1;
        
        for (const cmd of formattedCmds) {
          const addition = (currentFieldVal ? ", " : "") + cmd;
          if (currentFieldVal.length + addition.length > 1020) {
            const fieldName = partIndex === 1 ? stdName : `${stdName} (Cont.)`;
            const fieldLen = fieldName.length + currentFieldVal.length;
            
            if (currentEmbedCharCount + fieldLen > 5500) {
              embeds.push(currentEmbed);
              pageNum++;
              currentEmbed = new UniversalEmbed("neutral", undefined, guild)
                .setTitle(`All Commands (Page ${pageNum})`);
              currentEmbedCharCount = currentEmbed.data.title!.length;
            }
            
            currentEmbed.addFields({ name: fieldName, value: currentFieldVal });
            currentEmbedCharCount += fieldLen;
            
            currentFieldVal = cmd;
            partIndex++;
          } else {
            currentFieldVal += addition;
          }
        }
        if (currentFieldVal) {
          const fieldName = partIndex === 1 ? stdName : `${stdName} (Cont.)`;
          const fieldLen = fieldName.length + currentFieldVal.length;
          
          if (currentEmbedCharCount + fieldLen > 5500) {
            embeds.push(currentEmbed);
            pageNum++;
            currentEmbed = new UniversalEmbed("neutral", undefined, guild)
              .setTitle(`All Commands (Page ${pageNum})`);
            currentEmbedCharCount = currentEmbed.data.title!.length;
          }
          
          currentEmbed.addFields({ name: fieldName, value: currentFieldVal });
          currentEmbedCharCount += fieldLen;
        }
      }
    }
  }

  embeds.push(currentEmbed);
  return embeds;
}

export const helpCommand: Command = {
  name: "help",
  description: "Displays available commands.",
  category: "Configuration",
  usage: "help [command | category]",
  examples: ["help", "help ban", "help moderation"],
  execute: async (ctx: any) => {
    let targetCmd = ctx.getStringOption("command", 0);
    let query = targetCmd?.toLowerCase().trim();
    if (!ctx.isInteraction && ctx.args.length > 0) {
      query = ctx.args.join(" ").toLowerCase().trim();
    }

    if (query) {
      if (query === "tempvc" || query.startsWith("tempvc ")) {
        if (query === "tempvc") {
          const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
            .setTitle("🔊 tempvc")
            .setDescription(
              `**Description:** Manage temporary voice channels and configurations.\n` +
              `**Usage:** \`${ctx.prefix}tempvc <lock | unlock | hide | unhide | rename | limit | trust | untrust | kick | block | claim | transfer | sendpanel | generator>\``
            );
          return ctx.reply({ embeds: [embed] });
        }

        const desc = TEMPVC_DESCRIPTIONS[query];
        const usage = COMMAND_USAGES[query];
        if (desc && usage) {
          const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
            .setTitle(`🔊 ${query}`)
            .setDescription(`**Description:** ${desc}\n**Usage:** \`${ctx.prefix}${usage}\``);
          return ctx.reply({ embeds: [embed] });
        }
      }

      const resolvedCat = resolveCategory(query);
      if (resolvedCat) {
        const embed = getCategoryEmbed(resolvedCat, ctx.prefix, ctx.guild);
        if (ctx.isInteraction) {
          return ctx.reply({ embeds: [embed], ephemeral: true });
        } else {
          const button = new ButtonBuilder()
            .setCustomId(`help:show:${resolvedCat}:${ctx.user.id}`)
            .setLabel("View Help")
            .setEmoji(parseEmoji(EMOJIS.pad) as any)
            .setStyle(ButtonStyle.Primary);

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
          const triggerEmbed = new UniversalEmbed("neutral", undefined, ctx.guild)
            .setDescription(`Help lookup for category **${resolveStandardCategoryName(resolvedCat)}** requested by ${ctx.user}. Click below to view.`);
          return ctx.reply({ embeds: [triggerEmbed], components: [row] }, 15);
        }
      }

      let command = CommandRegistry.get(query);
      
      // Fallback for subcommands: if "query" is "counting channel", find base command "counting"
      if (!command && query.includes(" ")) {
        const baseQuery = query.split(" ")[0];
        command = CommandRegistry.get(baseQuery);
      }

      if (command) {
        const moduleKey = getCommandModule(command.category);
        const emoji = EMOJIS[moduleKey as keyof typeof EMOJIS] || EMOJIS.settings;

        const usageStr = command.usage || COMMAND_USAGES[command.name.toLowerCase()] || command.name;
        const examplesList = command.examples && command.examples.length > 0
          ? command.examples.map(ex => `\`${ctx.prefix}${ex}\``).join(", ")
          : null;

        let embedDesc = `**Description:** ${command.description}\n**Usage:** \`${ctx.prefix}${usageStr}\``;
        if (examplesList) {
          embedDesc += `\n**Example(s):** ${examplesList}`;
        }

        const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
          .setTitle(`${emoji}・${command.name}`)
          .setDescription(embedDesc);

        if (ctx.isInteraction) {
          return ctx.reply({ embeds: [embed], ephemeral: true });
        } else {
          const button = new ButtonBuilder()
            .setCustomId(`help:show:${command.name}:${ctx.user.id}`)
            .setLabel("View Help")
            .setEmoji(parseEmoji(EMOJIS.pad) as any)
            .setStyle(ButtonStyle.Primary);

          const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);
          const triggerEmbed = new UniversalEmbed("neutral", undefined, ctx.guild)
            .setDescription(`Help lookup for command **${command.name}** requested by ${ctx.user}. Click below to view.`);
          return ctx.reply({ embeds: [triggerEmbed], components: [row] }, 15);
        }
      }

      // Check if command is manually defined in COMMAND_USAGES but not registered in registry yet (shows as planned command)
      const usageStr = COMMAND_USAGES[query];
      if (usageStr) {
        const embed = new UniversalEmbed("neutral", undefined, ctx.guild)
          .setTitle(`🔧・${query}`)
          .setDescription(
            `**Description:** Server command (configuration pending).\n` +
            `**Usage:** \`${ctx.prefix}${usageStr}\``
          );
        return ctx.reply({ embeds: [embed] });
      }

      return ctx.reply({ embeds: [UniversalEmbed.error(`Command or Category \`${query}\` not found.`, ctx.guild)] }, 5);
    }

    const homeEmbed = getHomeEmbed(ctx.prefix, ctx.guild);
    const components = getHelpComponents(ctx.user.id);

    return ctx.reply({ embeds: [homeEmbed], components: components as any });
  }
};

