import { createCanvas, loadImage, GlobalFonts } from "@napi-rs/canvas";

// Use standard sans-serif system fonts as fallback
GlobalFonts.registerFromPath("C:\\Windows\\Fonts\\arial.ttf", "Arial");

export async function drawWelcomeCard(
  avatarUrl: string,
  username: string,
  serverName: string,
  memberCount: string,
  bgUrl?: string
): Promise<Buffer> {
  const canvas = createCanvas(800, 350);
  const ctx = canvas.getContext("2d");

  // Draw background gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 350);
  grad.addColorStop(0, "#0f172a"); // Dark slate
  grad.addColorStop(1, "#1e293b");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 350);

  // Draw inner glow border
  ctx.strokeStyle = "#38bdf8"; // cyan border
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 780, 330);

  // Fetch and draw avatar
  try {
    const response = await fetch(avatarUrl);
    if (response.ok) {
      const avatarBuffer = Buffer.from(await response.arrayBuffer());
      const avatarImage = await loadImage(avatarBuffer);

      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 175, 80, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImage, 70, 95, 160, 160);
      ctx.restore();

      // Avatar border
      ctx.beginPath();
      ctx.arc(150, 175, 82, 0, Math.PI * 2);
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  } catch (err) {
    console.error("⚠️ Failed to load welcome card avatar:", err);
    // Draw placeholder avatar circle
    ctx.beginPath();
    ctx.arc(150, 175, 80, 0, Math.PI * 2);
    ctx.fillStyle = "#475569";
    ctx.fill();
    ctx.strokeStyle = "#38bdf8";
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Draw texts
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.fillText("WELCOME", 280, 130);

  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 44px Arial";
  // Limit username length to prevent overflow
  const cleanUsername = username.length > 15 ? username.substring(0, 15) + "..." : username;
  ctx.fillText(cleanUsername, 280, 190);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "24px Arial";
  ctx.fillText(`Joined ${serverName}`, 280, 240);

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "italic 20px Arial";
  ctx.fillText(`Member #${memberCount}`, 280, 280);

  return canvas.toBuffer("image/png");
}

export async function drawBoostCard(
  avatarUrl: string,
  username: string,
  serverName: string
): Promise<Buffer> {
  const canvas = createCanvas(800, 350);
  const ctx = canvas.getContext("2d");

  // Draw pink boost gradient
  const grad = ctx.createLinearGradient(0, 0, 800, 350);
  grad.addColorStop(0, "#1e1b4b"); // Deep indigo
  grad.addColorStop(1, "#311042"); // Deep purple/pink
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 800, 350);

  ctx.strokeStyle = "#f43f5e"; // Pink border
  ctx.lineWidth = 6;
  ctx.strokeRect(10, 10, 780, 330);

  // Draw avatar
  try {
    const response = await fetch(avatarUrl);
    if (response.ok) {
      const avatarBuffer = Buffer.from(await response.arrayBuffer());
      const avatarImage = await loadImage(avatarBuffer);

      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 175, 80, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatarImage, 70, 95, 160, 160);
      ctx.restore();

      ctx.beginPath();
      ctx.arc(150, 175, 82, 0, Math.PI * 2);
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 4;
      ctx.stroke();
    }
  } catch (err) {
    console.error("⚠️ Failed to load boost card avatar:", err);
  }

  // Draw texts
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 36px Arial";
  ctx.fillText("SERVER BOOSTED!", 280, 130);

  ctx.fillStyle = "#f43f5e";
  ctx.font = "bold 44px Arial";
  ctx.fillText(username, 280, 190);

  ctx.fillStyle = "#94a3b8";
  ctx.font = "24px Arial";
  ctx.fillText(`Thank you for boosting ${serverName}`, 280, 240);

  return canvas.toBuffer("image/png");
}

export async function drawLeaderboardCard(
  title: string,
  entries: { username: string; value: string | number }[]
): Promise<Buffer> {
  const canvas = createCanvas(600, 500);
  const ctx = canvas.getContext("2d");

  // Draw card background
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, 600, 500);

  ctx.strokeStyle = "#3b82f6"; // Blue border
  ctx.lineWidth = 4;
  ctx.strokeRect(5, 5, 590, 490);

  // Draw Title
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial";
  ctx.textAlign = "center";
  ctx.fillText(title, 300, 50);

  // Draw separator line
  ctx.strokeStyle = "#1e293b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(30, 75);
  ctx.lineTo(570, 75);
  ctx.stroke();

  // Draw entries
  ctx.textAlign = "left";
  let y = 120;
  for (let i = 0; i < 7; i++) {
    const entry = entries[i];
    const rank = i + 1;

    // Background panel for each row
    ctx.fillStyle = rank === 1 ? "#1e293b" : "#131b2e";
    ctx.fillRect(25, y - 30, 550, 45);

    // Rank text
    ctx.font = "bold 20px Arial";
    ctx.fillStyle = rank === 1 ? "#fbbf24" : rank === 2 ? "#cbd5e1" : rank === 3 ? "#b45309" : "#64748b";
    ctx.fillText(`#${rank}`, 40, y);

    // Username & Value
    if (entry) {
      ctx.fillStyle = "#f8fafc";
      ctx.font = "18px Arial";
      const displayUsername = entry.username.length > 20 ? entry.username.substring(0, 20) + "..." : entry.username;
      ctx.fillText(displayUsername, 90, y);

      ctx.fillStyle = "#38bdf8";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "right";
      ctx.fillText(String(entry.value), 550, y);
      ctx.textAlign = "left";
    } else {
      ctx.fillStyle = "#475569";
      ctx.font = "italic 16px Arial";
      ctx.fillText("Empty Slot", 90, y);
    }

    y += 55;
  }

  return canvas.toBuffer("image/png");
}
