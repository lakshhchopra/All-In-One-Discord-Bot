import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Interaction } from "discord.js";
import { CommandContext } from "../commands/context.js";
import { handleCommand, CommandRegistry } from "../commands/command.js";
import { prisma } from "../services/db.js";
import { UniversalEmbed } from "../services/embed.js";
import { EMOJIS } from "../config/emojis.js";
import { 
  getHomeEmbed, 
  getCategoryEmbed, 
  getAllCommandsEmbed,
  resolveCategory,
  getCommandModule,
  COMMAND_USAGES
} from "../modules/configuration/commands.js";

export async function handleInteractionCreate(interaction: Interaction) {
  // Handle Help Menu Interactions
  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    const customId = interaction.customId;
    if (customId.startsWith("help:")) {
      const parts = customId.split(":");
      const action = parts[1];
      const targetUserId = action === "show" ? parts[3] : parts[2];

      if (interaction.user.id !== targetUserId) {
        return interaction.reply({ content: "❌ You cannot use this help menu. Run `-help` to create your own.", ephemeral: true });
      }

      const guildId = interaction.guildId!;
      const config = await prisma.guildConfig.findUnique({ where: { guildId } });
      const prefix = config?.prefix ?? "-";

      if (action === "home") {
        const embed = getHomeEmbed(prefix, interaction.guild!);
        await interaction.update({ embeds: [embed] });
      } 
      else if (action === "delete") {
        await interaction.message.delete();
      } 
      else if (action === "all") {
        const embed = getAllCommandsEmbed(prefix, interaction.guild!);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } 
      else if (action === "category" && interaction.isStringSelectMenu()) {
        const selectedCategory = interaction.values[0];
        const embed = getCategoryEmbed(selectedCategory, prefix, interaction.guild!);
        await interaction.reply({ embeds: [embed], ephemeral: true });
      }
      else if (action === "show") {
        try {
          await interaction.message.delete();
        } catch {}

        const targetCmd = parts[2];
        const resolvedCat = resolveCategory(targetCmd);

        if (resolvedCat) {
          const embed = getCategoryEmbed(resolvedCat, prefix, interaction.guild!);
          return interaction.reply({ embeds: [embed], ephemeral: true });
        }

        const command = CommandRegistry.get(targetCmd);
        if (!command) {
          return interaction.reply({ 
            embeds: [UniversalEmbed.error(`Command or Category \`${targetCmd}\` not found.`, interaction.guild!)], 
            ephemeral: true 
          });
        }

        const moduleKey = getCommandModule(command.category);
        const emojiKey = moduleKey === "extra" ? "settings" : moduleKey;
        const emoji = EMOJIS[emojiKey as keyof typeof EMOJIS] || EMOJIS.settings;
        
        const usageStr = command.usage || COMMAND_USAGES[command.name.toLowerCase()] || command.name;
        const examplesList = command.examples && command.examples.length > 0
          ? command.examples.map(ex => `\`${prefix}${ex}\``).join(", ")
          : null;

        let embedDesc = `**Description:** ${command.description}\n**Usage:** \`${prefix}${usageStr}\``;
        if (examplesList) {
          embedDesc += `\n**Example(s):** ${examplesList}`;
        }

        const embed = new UniversalEmbed("neutral", undefined, interaction.guild!)
          .setTitle(`${emoji}・${command.name}`)
          .setDescription(embedDesc);

        return interaction.reply({ embeds: [embed], ephemeral: true });
      }
      return;
    }
  }

  if (interaction.isChatInputCommand()) {
    const ctx = new CommandContext(interaction);
    await ctx.initPrefix();
    await handleCommand(ctx, interaction.commandName);
  }

  else if (interaction.isButton()) {
    const customId = interaction.customId;

    if (customId === "giveaway_join") {
      const msgId = interaction.message.id;
      const userId = interaction.user.id;

      const giveaway = await prisma.giveaway.findUnique({ where: { id: msgId } });
      if (!giveaway || giveaway.ended) {
        return interaction.reply({ content: "❌ This giveaway has ended or does not exist.", ephemeral: true });
      }

      let entries = giveaway.entries;
      let replyText = "";

      if (entries.includes(userId)) {
        // Already entered -> remove entry (opt-out option)
        entries = entries.filter(id => id !== userId);
        replyText = "❌ You have left the giveaway.";
      } else {
        entries.push(userId);
        replyText = "🎉 You have entered the giveaway!";
      }

      await prisma.giveaway.update({
        where: { id: msgId },
        data: { entries }
      });

      try {
        const joinButton = new ButtonBuilder()
          .setCustomId("giveaway_join")
          .setLabel(`Join (${entries.length})`)
          .setEmoji("🎉")
          .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder<ButtonBuilder>().addComponents(joinButton);

        await interaction.update({ components: [row] });
      } catch {}

      await interaction.followUp({ content: replyText, ephemeral: true });
    }
  }
}
