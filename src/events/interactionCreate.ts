import { Interaction } from "discord.js";
import { CommandContext } from "../commands/context.js";
import { handleCommand } from "../commands/command.js";
import { prisma } from "../services/db.js";
import { UniversalEmbed } from "../services/embed.js";

export async function handleInteractionCreate(interaction: Interaction) {
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

      // Update button label
      try {
        const components = interaction.message.components.map(row => {
          return {
            type: row.type,
            components: row.components.map(comp => {
              if (comp.customId === "giveaway_join") {
                return {
                  type: comp.type,
                  customId: comp.customId,
                  label: `Join (${entries.length})`,
                  emoji: comp.emoji ?? undefined,
                  style: comp.style
                };
              }
              return comp;
            })
          };
        });

        await interaction.update({ components: components as any });
      } catch {}

      await interaction.followUp({ content: replyText, ephemeral: true });
    }
  }
}
