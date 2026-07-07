import { Command, CommandRegistry } from "../../commands/command.js";
import { CommandContext } from "../../commands/context.js";
import { UniversalEmbed } from "../../services/embed.js";
import { prisma } from "../../services/db.js";
import { EMOJIS, parseEmoji, getEmojiUrl } from "../../config/emojis.js";

export const setPrefixCommand: Command = {
  name: "setprefix",
  description: "Sets the bot prefix for the server.",
  category: "Configuration",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const newPrefix = ctx.getStringOption("prefix", 0);
    if (!newPrefix) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a new prefix.", ctx.guild)] }, 5);
    }

    if (newPrefix.length > 5) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Prefix length cannot exceed 5 characters.", ctx.guild)] }, 5);
    }

    await prisma.guildConfig.upsert({
      where: { guildId: ctx.guild.id },
      update: { prefix: newPrefix },
      create: { guildId: ctx.guild.id, prefix: newPrefix }
    });

    return ctx.reply({ embeds: [UniversalEmbed.success(`Prefix has been successfully set to \`${newPrefix}\``, ctx.guild)] });
  }
};

export const configCommand: Command = {
  name: "config",
  description: "View, import or export server configuration.",
  category: "Configuration",
  permissionLevel: "ADMIN",
  execute: async (ctx) => {
    const sub = ctx.getStringOption("action", 0);

    if (sub === "export") {
      const data = await prisma.guildConfig.findUnique({
        where: { guildId: ctx.guild.id }
      });
      if (!data) {
        return ctx.reply({ embeds: [UniversalEmbed.error("No configuration found to export.", ctx.guild)] });
      }
      return ctx.reply({
        content: `Here is your exported configuration. Copy and save this backup string:\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``
      });
    }

    if (sub === "import") {
      const importJson = ctx.getStringOption("data", 1);
      if (!importJson) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please provide the JSON string to import.", ctx.guild)] }, 5);
      }

      try {
        const parsed = JSON.parse(importJson);
        // Ensure we don't import random server settings
        delete parsed.guildId;
        delete parsed.createdAt;
        delete parsed.updatedAt;

        await prisma.guildConfig.upsert({
          where: { guildId: ctx.guild.id },
          update: parsed,
          create: { guildId: ctx.guild.id, ...parsed }
        });

        return ctx.reply({ embeds: [UniversalEmbed.success("Configuration imported successfully.", ctx.guild)] });
      } catch (err) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Failed to parse the configuration. Ensure it's valid JSON.", ctx.guild)] });
      }
    }

    // View Config
    const data = await prisma.guildConfig.findUnique({
      where: { guildId: ctx.guild.id }
    });

    const embed = UniversalEmbed.info("Server Configuration Settings", ctx.guild)
      .addFields(
        { name: "Prefix", value: `\`${data?.prefix ?? "-"}\``, inline: true },
        { name: "Language", value: `\`${data?.language ?? "en"}\``, inline: true },
        { name: "Timezone", value: `\`${data?.timezone ?? "UTC"}\``, inline: true },
        { name: "Welcomer Channel", value: data?.welcomeChannelId ? `<#${data.welcomeChannelId}>` : "Not Configured", inline: true },
        { name: "Logging Enabled", value: data?.logEnabled ? "Yes" : "No", inline: true },
        { name: "Anti-Raid", value: data?.antiRaidEnabled ? "Active" : "Disabled", inline: true },
        { name: "Anti-Nuke", value: data?.antiNukeEnabled ? "Active" : "Disabled", inline: true }
      );

    return ctx.reply({ embeds: [embed] });
  }
};

import { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, Guild } from "discord.js";

export function getCommandsForOption(optionValue: string): string[] {
  const allCmds = CommandRegistry.getAll();
  let categories: string[] = [];
  switch (optionValue) {
    case "antinuke":
      categories = ["Security", "Anti Raid"];
      break;
    case "moderation":
      categories = ["Moderation"];
      break;
    case "welcomer":
      categories = ["Welcomer"];
      break;
    case "giveaways":
      categories = ["Giveaway"];
      break;
    case "voicemaster":
      categories = ["Temporary Voice"];
      break;
    case "voice":
      categories = ["Voice Moderation"];
      break;
    case "media":
      categories = ["Extras"];
      break;
    case "extra":
      categories = ["Configuration", "Logging", "Invite Tracking", "Message Tracking", "Games", "Information"];
      break;
  }
  return allCmds.filter(cmd => categories.includes(cmd.category)).map(cmd => cmd.name);
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
        { label: "Antinuke", value: "antinuke", description: "Anti-Nuke & Anti-Raid systems", emoji: parseEmoji(EMOJIS.antinuke) as any },
        { label: "Moderation", value: "moderation", description: "Server moderation commands", emoji: parseEmoji(EMOJIS.moderation) as any },
        { label: "Welcomer", value: "welcomer", description: "Greeting & welcome cards", emoji: parseEmoji(EMOJIS.welcomer) as any },
        { label: "Giveaways", value: "giveaways", description: "Create & host giveaways", emoji: parseEmoji(EMOJIS.giveaway) as any },
        { label: "Voicemaster", value: "voicemaster", description: "Temporary voice channels", emoji: parseEmoji(EMOJIS.voicemaster) as any },
        { label: "Voice", value: "voice", description: "Voice channel moderation", emoji: parseEmoji(EMOJIS.voice) as any },
        { label: "Media", value: "media", description: "Custom embeds & responders", emoji: parseEmoji(EMOJIS.media) as any },
        { label: "Extra", value: "extra", description: "Bot configuration & utility info", emoji: parseEmoji(EMOJIS.settings) as any }
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
      `- **Total commands:** \`${totalCmds}\`\n` +
      `## ${EMOJIS.module} Modules\n` +
      `${EMOJIS.antinuke}・**Antinuke**\n` +
      `${EMOJIS.moderation}・**Moderation**\n` +
      `${EMOJIS.welcomer}・**Welcomer**\n` +
      `${EMOJIS.giveaway}・**Giveaways**\n` +
      `${EMOJIS.voicemaster}・**Voicemaster**\n` +
      `${EMOJIS.voice}・**Voice**\n` +
      `${EMOJIS.media}・**Media**\n` +
      `${EMOJIS.settings}・**Extra**\n\n` +
      `🔗 **Links**\n` +
      `[Support](https://discord.gg/gupshup)`
    )
  return embed;
}

export const COMMAND_USAGES: Record<string, string> = {
  setprefix: "setprefix <new_prefix>",
  config: "config",
  help: "help [command]",
  setgreet: "setgreet <channel|message|autodelete> <value>",
  setboost: "setboost <channel|message|autodelete> <value>",
  greet: "greet [member]",
  boost: "boost [member]",
  greetdm: "greetdm <enable|disable>",
  boostdm: "boostdm <enable|disable>",
  say: "say <channel> <message>",
  purge: "purge <amount> [member]",
  ban: "ban <member> [reason]",
  unban: "unban <user_id>",
  kick: "kick <member> [reason]",
  mute: "mute <member> [duration] [reason]",
  unmute: "unmute <member>",
  timeout: "timeout <member> <duration> [reason]",
  lock: "lock [channel]",
  unlock: "unlock [channel]",
  nickname: "nickname <member> [new_nickname]",
  role: "role <add|remove> <member> <role>",
  emoji: "emoji steal <url> <name>",
  slowmode: "slowmode <seconds>",
  setupgenerator: "setupgenerator <channel>",
  generatorname: "generatorname <name_template>",
  generatorcategory: "generatorcategory <category_id>",
  tempvc: "tempvc <lock|unlock|name|limit|claim>",
  vcmute: "vcmute <member>",
  vcunmute: "vcunmute <member>",
  vcdeafen: "vcdeafen <member>",
  vcundeafen: "vcundeafen <member>",
  vckick: "vckick <member>",
  embed: "embed create <channel> <title> <description>",
  autoresponder: "autoresponder <add|remove|list> <trigger> [response]",
  setlogchannel: "setlogchannel <channel>",
  log: "log <enable|disable>",
  antinuke: "antinuke <setup|enable|disable|limits>",
  whitelist: "whitelist <add|remove|list> <member>",
  extraowner: "extraowner <add|remove|list> <member>",
  antiraid: "antiraid <enable|disable|joins|accountage|autoban>",
  invites: "invites [member]",
  inviterewards: "inviterewards <add|remove|list> <invites> <role>",
  inviteleaderboard: "inviteleaderboard",
  messages: "messages [member]",
  messageleaderboard: "messageleaderboard",
  giveaway: "giveaway <start|end|reroll> <channel> [duration] [winners] [prize]",
  setcountchannel: "setcountchannel <channel>",
  ping: "ping",
  afk: "afk [message]",
  userinfo: "userinfo [member]",
  serverinfo: "serverinfo",
  avatar: "avatar [member]",
  membercount: "membercount",
  botinfo: "botinfo"
};

export function resolveCategory(input: string): string | null {
  const norm = input.toLowerCase().trim();
  if (norm === "antinuke" || norm === "security" || norm === "anti raid" || norm === "antiraid") return "antinuke";
  if (norm === "moderation" || norm === "mod") return "moderation";
  if (norm === "welcomer" || norm === "welcome") return "welcomer";
  if (norm === "giveaways" || norm === "giveaway") return "giveaways";
  if (norm === "voicemaster" || norm === "tempvc" || norm === "temporary voice") return "voicemaster";
  if (norm === "voice" || norm === "voicemod" || norm === "voice moderation") return "voice";
  if (norm === "media" || norm === "embeds" || norm === "extras") return "media";
  if (norm === "extra" || norm === "extras" || norm === "settings" || norm === "config" || norm === "configuration" || norm === "info" || norm === "information") return "extra";
  return null;
}

export function getCommandModule(category: string): string {
  const catLower = category.toLowerCase();
  if (catLower.includes("security") || catLower.includes("raid")) return "antinuke";
  if (catLower.includes("mod") && !catLower.includes("voice")) return "moderation";
  if (catLower.includes("welcome")) return "welcomer";
  if (catLower.includes("giveaway")) return "giveaways";
  if (catLower.includes("temp") || catLower.includes("generator")) return "voicemaster";
  if (catLower.includes("voice")) return "voice";
  if (catLower.includes("extra") || catLower.includes("responder")) return "media";
  return "extra";
}

export function getCategoryEmbed(categoryName: string, prefix: string, guild?: Guild) {
  const cmdNames = getCommandsForOption(categoryName);
  
  let formattedCategory = categoryName.charAt(0).toUpperCase() + categoryName.slice(1);
  if (categoryName === "antinuke") formattedCategory = "Antinuke";
  else if (categoryName === "giveaways") formattedCategory = "Giveaways";
  else if (categoryName === "voicemaster") formattedCategory = "Voicemaster";
  else if (categoryName === "welcomer") formattedCategory = "Welcomer";

  const emojiKey = categoryName === "extra" ? "settings" : categoryName;
  const emoji = EMOJIS[emojiKey as keyof typeof EMOJIS] || EMOJIS.settings;

  const embed = new UniversalEmbed("neutral", undefined, guild)
    .setTitle(`${emoji}・${formattedCategory}`)
    .setDescription(cmdNames.length > 0 ? cmdNames.map(c => `\`${c}\``).join(", ") : "No commands in this category.");

  return embed;
}

export function getAllCommandsEmbed(prefix: string, guild?: Guild) {
  const embed = new UniversalEmbed("neutral", undefined, guild)
    .setTitle("All Commands");

  const categoriesList = ["antinuke", "moderation", "welcomer", "giveaways", "voicemaster", "voice", "media", "extra"];
  for (const cat of categoriesList) {
    const cmdNames = getCommandsForOption(cat);
    const formattedCat = cat.charAt(0).toUpperCase() + cat.slice(1);
    if (cmdNames.length > 0) {
      embed.addFields({ name: formattedCat, value: cmdNames.map(c => `\`${c}\``).join(", ") });
    }
  }

  return embed;
}

export const helpCommand: Command = {
  name: "help",
  description: "Displays available commands.",
  category: "Configuration",
  execute: async (ctx) => {
    const targetCmd = ctx.getStringOption("command", 0);

    if (targetCmd) {
      // 1. Resolve immediately if already inside an interaction (slash command)
      if (ctx.isInteraction) {
        const resolvedCat = resolveCategory(targetCmd);
        if (resolvedCat) {
          const embed = getCategoryEmbed(resolvedCat, ctx.prefix, ctx.guild);
          return ctx.reply({ embeds: [embed], ephemeral: true });
        }

        const command = CommandRegistry.get(targetCmd);
        if (!command) {
          return ctx.reply({ embeds: [UniversalEmbed.error(`Command or Category \`${targetCmd}\` not found.`, ctx.guild)], ephemeral: true }, 5);
        }

        const moduleKey = getCommandModule(command.category);
        const emojiKey = moduleKey === "extra" ? "settings" : moduleKey;
        const emoji = EMOJIS[emojiKey as keyof typeof EMOJIS] || EMOJIS.settings;
        
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

        return ctx.reply({ embeds: [embed], ephemeral: true });
      }

      // 2. Otherwise (prefix command), prompt the user with a button that launches the ephemeral helper
      const resolvedCat = resolveCategory(targetCmd);
      const isCategory = !!resolvedCat;
      let displayName = targetCmd.toLowerCase();

      if (isCategory) {
        displayName = resolvedCat.charAt(0).toUpperCase() + resolvedCat.slice(1);
      } else {
        const cmd = CommandRegistry.get(targetCmd);
        if (cmd) displayName = cmd.name;
      }

      const button = new ButtonBuilder()
        .setCustomId(`help:show:${targetCmd.toLowerCase()}:${ctx.user.id}`)
        .setLabel("View Help")
        .setEmoji(parseEmoji(EMOJIS.pad) as any)
        .setStyle(ButtonStyle.Primary);

      const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

      const triggerEmbed = new UniversalEmbed("neutral", undefined, ctx.guild)
        .setDescription(`Help lookup for **${displayName}** requested by ${ctx.user}. Click below to view.`);

      return ctx.reply({ embeds: [triggerEmbed], components: [row] }, 15);
    }

    const homeEmbed = getHomeEmbed(ctx.prefix, ctx.guild);
    const components = getHelpComponents(ctx.user.id);

    return ctx.reply({ embeds: [homeEmbed], components: components as any });
  }
};

export function registerConfiguration() {
  CommandRegistry.register(setPrefixCommand);
  CommandRegistry.register(configCommand);
  CommandRegistry.register(helpCommand);
}
