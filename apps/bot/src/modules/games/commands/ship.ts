import { 
  AttachmentBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  UserSelectMenuBuilder, 
  SlashCommandBuilder, 
  GuildMember 
} from "discord.js";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";

// Helper to determine deterministic percentage based on IDs and mode
function getShipPercentage(id1: string, id2: string, mode: string): number {
  const combined = [id1, id2].sort().join("") + mode;
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    hash = combined.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % 101); // 0 to 100
}

// Helper to resolve text and descriptions based on percentage and mode
function getShipText(
  user1: any,
  user2: any,
  percentage: number,
  mode: "love" | "hate" | "friendship"
): { content: string; desc: string } {
  const u1Name = user1.displayName || user1.user?.username || user1.username;
  const u2Name = user2.displayName || user2.user?.username || user2.username;
  
  if (mode === "love") {
    const emoji = percentage >= 50 ? "💖" : "💔";
    let desc = "";
    if (percentage <= 20) {
      desc = `🌑 In this endless universe, **${u1Name}** and **${u2Name}** are just two distant stars 🌑`;
    } else if (percentage <= 50) {
      desc = `💔 **${u1Name}** and **${u2Name}** are still figuring things out, and that's totally fine 💔`;
    } else if (percentage <= 80) {
      desc = `🌸 The chemistry is brewing! **${u1Name}** and **${u2Name}** have a good spark 🌸`;
    } else if (percentage <= 99) {
      desc = `💖 A match made in heaven! **${u1Name}** and **${u2Name}** are absolutely meant to be 💖`;
    } else {
      desc = `💍 True soulmates! **${u1Name}** and **${u2Name}** are bound together for eternity 💍`;
    }
    return {
      content: `<@${user1.id}> + <@${user2.id}> = **${percentage}%** of Love ${emoji}`,
      desc
    };
  } else if (mode === "hate") {
    const emoji = percentage >= 50 ? "🔥" : "🕊️";
    let desc = "";
    if (percentage <= 20) {
      desc = `🕊️ No storm brews between **${u1Name}** and **${u2Name}**, only calm.`;
    } else if (percentage <= 50) {
      desc = `⚡ Subtle tension is in the air, but they keep it under wraps.`;
    } else if (percentage <= 80) {
      desc = `🔥 Sparks fly, and not the good kind! Avoid putting them in the same room. 🔥`;
    } else if (percentage <= 99) {
      desc = `☠️ Pure rivalry! **${u1Name}** and **${u2Name}** are in a constant state of war ☠️`;
    } else {
      desc = `💥 Archenemies! **${u1Name}** and **${u2Name}** cannot stand each other's existence 💥`;
    }
    return {
      content: `<@${user1.id}> + <@${user2.id}> = **${percentage}%** of Hate ${emoji}`,
      desc
    };
  } else {
    const emoji = "⭐";
    let desc = "";
    if (percentage <= 20) {
      desc = `❄️ Just acquaintances. A nod in the hallway is all they share.`;
    } else if (percentage <= 50) {
      desc = `🤝 Casual friends. They get along, but don't share secrets.`;
    } else if (percentage <= 80) {
      desc = `🎉 Good buddies! They share laughs and always have a great time together.`;
    } else if (percentage <= 99) {
      desc = `🌟 Inseparable best friends! They have each other's backs no matter what 🌟`;
    } else {
      desc = `✨ Platonic soulmates! **${u1Name}** and **${u2Name}** share a bond that is unbreakable ✨`;
    }
    return {
      content: `<@${user1.id}> + <@${user2.id}> = **${percentage}%** of Friendship ${emoji}`,
      desc
    };
  }
}

// Bright vibrant pastel color generator
function getRandomPastelColor(): string {
  const h = Math.floor(Math.random() * 360);
  const s = Math.floor(Math.random() * 10) + 85; // 85% to 95%
  const l = Math.floor(Math.random() * 7) + 83; // 83% to 90%
  return `hsl(${h}, ${s}%, ${l}%)`;
}

// Generate the beautiful ship image card
async function generateShipCanvas(
  user1: { username: string; avatarUrl: string },
  user2: { username: string; avatarUrl: string },
  percentage: number,
  mode: "love" | "hate" | "friendship"
): Promise<Buffer> {
  const canvas = createCanvas(800, 300);
  const ctx = canvas.getContext("2d");

  const drawRoundedRect = (x: number, y: number, w: number, h: number, r: number, color: any) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();
  };

  // 1. Draw outer background with a random pastel gradient
  const color1 = getRandomPastelColor();
  const color2 = getRandomPastelColor();
  const gradient = ctx.createLinearGradient(0, 0, 800, 300);
  gradient.addColorStop(0, color1);
  gradient.addColorStop(1, color2);
  drawRoundedRect(0, 0, 800, 300, 24, gradient);

  // 2. Draw inner container shaded box
  drawRoundedRect(20, 20, 760, 260, 18, "rgba(255, 255, 255, 0.2)");

  // 3. Helper to draw circular avatars with drop shadows
  const drawCircularAvatar = async (url: string, cx: number, cy: number, r: number) => {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.12)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 3;
    
    // Draw outer white ring
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    // Disable shadow for clipping and avatar drawing
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Clip to circle for avatar
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    try {
      const img = await loadImage(url);
      ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
    } catch {
      // Fallback gray circle
      ctx.fillStyle = "#555555";
      ctx.fill();
    }
    
    ctx.restore();
  };

  // Draw both avatars
  await drawCircularAvatar(user1.avatarUrl, 180, 150, 85);
  await drawCircularAvatar(user2.avatarUrl, 620, 150, 85);

  // 4. Draw middle symbol based on mode
  const mx = 400;
  const my = 150;

  if (mode === "love") {
    const size = 130;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    // Draw Heart outline
    ctx.beginPath();
    ctx.moveTo(mx, my - size / 4);
    ctx.bezierCurveTo(mx - size / 2, my - size, mx - size, my - size / 3, mx, my + size / 2 + 10);
    ctx.bezierCurveTo(mx + size, my - size / 3, mx + size / 2, my - size, mx, my - size / 4);
    ctx.closePath();

    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    if (percentage > 0) {
      ctx.clip();
      ctx.fillStyle = "#ff5d8f"; // Cute vibrant pastel pink/red for love
      const fillHeight = (size * 1.5) * (percentage / 100);
      ctx.fillRect(mx - size, (my + size / 2 + 10) - fillHeight, size * 2, fillHeight);
    }
    ctx.restore();

    // Draw Percentage Text
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 6;
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${percentage}%`, mx, my - 10);
    ctx.restore();
  } 
  else if (mode === "hate") {
    const size = 130;

    // Left Half of broken heart
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = -2;
    ctx.shadowOffsetY = 2;
    ctx.translate(-4, 0);

    ctx.beginPath();
    ctx.moveTo(mx, my + size / 2 + 10);
    ctx.bezierCurveTo(mx - size, my - size / 3, mx - size / 2, my - size, mx, my - size / 4);
    // Crack zig-zag down
    ctx.lineTo(mx - 10, my - size / 4 + 25);
    ctx.lineTo(mx + 10, my - size / 4 + 50);
    ctx.lineTo(mx - 5, my - size / 4 + 75);
    ctx.lineTo(mx, my + size / 2 + 10);
    ctx.closePath();

    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    if (percentage > 0) {
      ctx.clip();
      ctx.fillStyle = "#6b705c"; // soft pastel sage hate color
      const fillHeight = (size * 1.5) * (percentage / 100);
      ctx.fillRect(mx - size, (my + size / 2 + 10) - fillHeight, size * 2, fillHeight);
    }
    ctx.restore();

    // Right Half of broken heart
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    ctx.translate(4, 0);

    ctx.beginPath();
    ctx.moveTo(mx, my + size / 2 + 10);
    ctx.bezierCurveTo(mx + size, my - size / 3, mx + size / 2, my - size, mx, my - size / 4);
    // Crack zig-zag down
    ctx.lineTo(mx - 10, my - size / 4 + 25);
    ctx.lineTo(mx + 10, my - size / 4 + 50);
    ctx.lineTo(mx - 5, my - size / 4 + 75);
    ctx.lineTo(mx, my + size / 2 + 10);
    ctx.closePath();

    ctx.lineWidth = 6;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    if (percentage > 0) {
      ctx.clip();
      ctx.fillStyle = "#582f0e"; // slightly darker wood brown pastel shading
      const fillHeight = (size * 1.5) * (percentage / 100);
      ctx.fillRect(mx - size, (my + size / 2 + 10) - fillHeight, size * 2, fillHeight);
    }
    ctx.restore();

    // Draw Percentage Text
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 6;
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${percentage}%`, mx, my - 10);
    ctx.restore();
  } 
  else if (mode === "friendship") {
    const outerRadius = 80;
    const innerRadius = 38;

    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 2;

    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    let step = Math.PI / 5;
    ctx.moveTo(mx, my - outerRadius);
    for (let i = 0; i < 5; i++) {
      ctx.lineTo(mx + Math.cos(rot) * outerRadius, my + Math.sin(rot) * outerRadius);
      rot += step;
      ctx.lineTo(mx + Math.cos(rot) * innerRadius, my + Math.sin(rot) * innerRadius);
      rot += step;
    }
    ctx.closePath();

    ctx.lineWidth = 8;
    ctx.strokeStyle = "#ffffff";
    ctx.stroke();

    if (percentage > 0) {
      ctx.clip();
      ctx.fillStyle = "#ffd166"; // beautiful warm golden pastel yellow
      const fillHeight = (outerRadius * 2) * (percentage / 100);
      ctx.fillRect(mx - outerRadius, (my + outerRadius) - fillHeight, outerRadius * 2, fillHeight);
    }
    ctx.restore();

    // Draw Percentage Text
    ctx.save();
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.25)";
    ctx.shadowBlur = 6;
    ctx.font = "bold 38px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`${percentage}%`, mx, my + 5);
    ctx.restore();
  }

  return canvas.toBuffer("image/png");
}

// Generate Discord action row components
function getComponents(mode: "love" | "hate" | "friendship", isSelectingUser: boolean = false) {
  if (isSelectingUser) {
    const selectRow = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId("ship_select_user")
        .setPlaceholder("Select a member to ship with...")
        .setMinValues(1)
        .setMaxValues(1)
    );
    const cancelRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId("ship_cancel_select")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    );
    return [selectRow, cancelRow];
  }

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId("ship_random")
      .setLabel("Random")
      .setEmoji("🎲")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("ship_change")
      .setLabel("Change User")
      .setEmoji("👥")
      .setStyle(ButtonStyle.Secondary)
  );

  if (mode === "love") {
    row.addComponents(
      new ButtonBuilder().setCustomId("ship_hate").setLabel("Hate").setEmoji("💔").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ship_friendship").setLabel("Friendship").setEmoji("⭐").setStyle(ButtonStyle.Secondary)
    );
  } else if (mode === "hate") {
    row.addComponents(
      new ButtonBuilder().setCustomId("ship_love").setLabel("Love").setEmoji("💖").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ship_friendship").setLabel("Friendship").setEmoji("⭐").setStyle(ButtonStyle.Secondary)
    );
  } else {
    row.addComponents(
      new ButtonBuilder().setCustomId("ship_love").setLabel("Love").setEmoji("💖").setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId("ship_hate").setLabel("Hate").setEmoji("💔").setStyle(ButtonStyle.Secondary)
    );
  }

  return [row];
}

export const shipCommand: Command = {
  name: "ship",
  description: "Calculate compatibility (Love, Hate, or Friendship) between users with interactive buttons and canvas.",
  category: "Games",
  usage: "ship [user1] [user2]",
  examples: ["ship", "ship @Koya", "ship @Koya @Lakshh"],
  slashBuilder: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("Calculate matching compatibility compatibility between users.")
    .addUserOption(option => 
      option.setName("user1").setDescription("The first user").setRequired(false)
    )
    .addUserOption(option => 
      option.setName("user2").setDescription("The second user").setRequired(false)
    ) as any,
  execute: async (ctx: any) => {
    // 1. Fetch all members to populate cache (including offline, bots, etc.)
    await ctx.guild.members.fetch().catch(() => null);

    let u1: GuildMember | null = null;
    let u2: GuildMember | null = null;

    const opt1 = ctx.getMemberOption("user1", 0);
    const opt2 = ctx.getMemberOption("user2", 1);

    if (opt1 && opt2) {
      u1 = opt1;
      u2 = opt2;
    } else if (opt1) {
      u1 = ctx.member;
      u2 = opt1;
    } else {
      u1 = ctx.member;
      // Get random member (can be bots or anyone in the server)
      u2 = ctx.guild.members.cache.filter(m => m.id !== ctx.user.id).random() || null;
    }

    if (!u2) {
      return ctx.reply({ embeds: [UniversalEmbed.error("Could not find any other member in the server to ship with!", ctx.guild)] }, 5);
    }

    const target1 = u1;
    let target2 = u2;
    let currentMode: "love" | "hate" | "friendship" = "love";
    let isSelectingUser = false;

    // Render payload generator
    const renderPayload = async () => {
      const u1Info = {
        username: target1.displayName || target1.user.username,
        avatarUrl: target1.user.displayAvatarURL({ extension: "png", size: 256 })
      };
      const u2Info = {
        username: target2.displayName || target2.user.username,
        avatarUrl: target2.user.displayAvatarURL({ extension: "png", size: 256 })
      };
      const percentage = getShipPercentage(target1.id, target2.id, currentMode);
      const buffer = await generateShipCanvas(u1Info, u2Info, percentage, currentMode);
      const attachment = new AttachmentBuilder(buffer, { name: `ship_${Date.now()}.png` });

      const shipInfo = getShipText(target1, target2, percentage, currentMode);

      return {
        content: `${shipInfo.content}\n${shipInfo.desc}`,
        files: [attachment],
        components: getComponents(currentMode, isSelectingUser) as any,
        allowedMentions: { parse: [] }
      };
    };

    // Recursive runner to execute each new ship calculation in a brand new message
    const runShipFlow = async (mode: "love" | "hate" | "friendship", currentTarget2: GuildMember) => {
      currentMode = mode;
      target2 = currentTarget2;

      const payload = await renderPayload();
      const response = await ctx.reply(payload);
      if (!response) return;

      const collector = response.createMessageComponentCollector({
        filter: (i) => i.user.id === ctx.user.id,
        time: 300000 // 5 minutes timeout
      });

      collector.on("collect", async (interaction) => {
        try {
          const id = interaction.customId;
          let nextMode = currentMode;
          let nextTarget2 = target2;
          let isSelectAction = false;

          if (id === "ship_love") {
            nextMode = "love";
          } else if (id === "ship_hate") {
            nextMode = "hate";
          } else if (id === "ship_friendship") {
            nextMode = "friendship";
          } else if (id === "ship_random") {
            // Find a new random member excluding target1 (can be bots)
            const newRandom = ctx.guild.members.cache.filter(m => m.id !== target1.id).random();
            if (newRandom) {
              nextTarget2 = newRandom;
            }
          } else if (id === "ship_change") {
            isSelectAction = true;
          } else if (id === "ship_cancel_select") {
            isSelectingUser = false;
            // Update components back to default buttons on same message
            const normalPayload = await renderPayload();
            await interaction.update({ components: normalPayload.components });
            return;
          } else if (interaction.isUserSelectMenu() && id === "ship_select_user") {
            const selectedId = interaction.values[0];
            const member = await ctx.guild.members.fetch(selectedId).catch(() => null);
            if (member) {
              nextTarget2 = member;
            }
          }

          if (isSelectAction) {
            // Update the menu picker inside the SAME message
            isSelectingUser = true;
            const selectPayload = await renderPayload();
            await interaction.update({ components: selectPayload.components });
            isSelectingUser = false; // reset state
          } else {
            // 1. Acknowledge and disable components on the current old message
            const disabledComponents = response.components.map(row => {
              const disabledRow = ActionRowBuilder.from(row as any);
              disabledRow.components.forEach((c: any) => c.setDisabled(true));
              return disabledRow;
            });
            await interaction.update({ components: disabledComponents as any }).catch(() => null);
            
            // 2. Stop this collector
            collector.stop("next");

            // 3. Spawn a brand new message flow
            await runShipFlow(nextMode, nextTarget2);
          }
        } catch (err) {
          console.error("Error processing ship interaction:", err);
        }
      });

      collector.on("end", async (_, reason) => {
        if (reason !== "next") {
          try {
            // Disable components after final timeout
            const disabledComponents = response.components.map(row => {
              const disabledRow = ActionRowBuilder.from(row as any);
              disabledRow.components.forEach((c: any) => c.setDisabled(true));
              return disabledRow;
            });
            await response.edit({ components: disabledComponents as any }).catch(() => null);
          } catch {}
        }
      });
    };

    // Begin the first message flow
    await runShipFlow(currentMode, target2);
  }
};

