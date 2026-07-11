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
  entries: { username: string; value: string | number; avatarUrl?: string }[]
): Promise<Buffer> {
  const canvas = createCanvas(700, 640);
  const ctx = canvas.getContext("2d");

  // Helper to draw rounded rectangle panels (pill/capsule shape with r = 26)
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

  // Helper to draw a simple message outline bubble icon
  const drawSpeechBubbleIcon = (x: number, y: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    const w = 18;
    const h = 13;
    const r = 3;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    // Simple bottom-right tail point
    ctx.lineTo(x + w - 4, y + h + 3);
    ctx.lineTo(x + w - 7, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  // Helper to draw a user silhouette icon for invites
  const drawUserIcon = (x: number, y: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.8;
    // Head
    ctx.beginPath();
    ctx.arc(x + 9, y + 4, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    // Shoulders
    ctx.beginPath();
    ctx.arc(x + 9, y + 14, 7, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  };

  // Helper to draw a counting target icon
  const drawCountingIcon = (x: number, y: number) => {
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
    ctx.lineWidth = 1.8;
    // Simple grid/hashtag lines
    ctx.beginPath();
    ctx.moveTo(x + 5, y);
    ctx.lineTo(x + 5, y + 14);
    ctx.moveTo(x + 11, y);
    ctx.lineTo(x + 11, y + 14);
    ctx.moveTo(x, y + 5);
    ctx.lineTo(x + 16, y + 5);
    ctx.moveTo(x, y + 11);
    ctx.lineTo(x + 16, y + 11);
    ctx.stroke();
    ctx.restore();
  };

  // No overall filled background rectangle - allows canvas transparency!

  // Determine icon type based on title
  const isInvites = title.includes("INVITE");
  const isCounting = title.includes("COUNTING");

  // 3. Draw entries
  let y = 10;
  for (let i = 0; i < 10; i++) {
    const entry = entries[i];
    const rank = i + 1;

    // Draw row background panel with fully rounded capsule ends (radius 26)
    drawRoundedRect(24, y, 652, 52, 26, "#1b1e26");

    // Avatar center coordinates
    const cx = 56;
    const cy = y + 26;
    const r = 19; // fully circular fits in 52px height

    // Draw Rank and separators
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.font = "bold 18px system-ui, -apple-system, sans-serif";

    let rankColor = "#7e8395"; // Rank 4+ default gray
    if (rank === 1) rankColor = "#ffb800"; // Rank 1 Gold
    else if (rank === 2) rankColor = "#cbd5e1"; // Rank 2 Silver
    else if (rank === 3) rankColor = "#d97706"; // Rank 3 Bronze/Orange

    ctx.fillStyle = rankColor;
    ctx.fillText(`#${rank}`, 92, cy);

    ctx.fillStyle = "#475569";
    ctx.font = "18px system-ui, -apple-system, sans-serif";
    ctx.fillText("•", 128, cy);

    if (entry) {
      // Draw Circular Avatar
      ctx.save();
      // Draw outer avatar ring
      ctx.beginPath();
      ctx.arc(cx, cy, r + 2, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
      ctx.fill();

      // Clip for avatar
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.clip();

      if (entry.avatarUrl) {
        try {
          const img = await loadImage(entry.avatarUrl);
          ctx.drawImage(img, cx - r, cy - r, r * 2, r * 2);
        } catch {
          // Fallback letter avatar
          ctx.fillStyle = "#334155";
          ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(entry.username.charAt(0).toUpperCase(), cx, cy);
        }
      } else {
        // Fallback letter avatar
        ctx.fillStyle = "#334155";
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px system-ui, -apple-system, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(entry.username.charAt(0).toUpperCase(), cx, cy);
      }
      ctx.restore();

      // Username
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      
      // Trim username if too long
      let displayUsername = entry.username;
      const maxUsernameWidth = 310;
      if (ctx.measureText(displayUsername).width > maxUsernameWidth) {
        while (ctx.measureText(displayUsername + "...").width > maxUsernameWidth && displayUsername.length > 0) {
          displayUsername = displayUsername.slice(0, -1);
        }
        displayUsername += "...";
      }
      ctx.fillText(displayUsername, 148, cy);

      // Score Value
      ctx.textAlign = "right";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px system-ui, -apple-system, sans-serif";
      ctx.fillText(String(entry.value), 632, cy);

      // Icon
      const iconX = 648;
      const iconY = y + 19;
      if (isInvites) {
        drawUserIcon(iconX, iconY);
      } else if (isCounting) {
        drawCountingIcon(iconX, iconY);
      } else {
        drawSpeechBubbleIcon(iconX, iconY);
      }
    } else {
      // Empty slot placeholder avatar
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = "#1e293b";
      ctx.fill();

      ctx.fillStyle = "#475569";
      ctx.font = "italic 16px system-ui, -apple-system, sans-serif";
      ctx.fillText("Empty Slot", 148, cy);
    }

    y += 62; // panel height (52) + gap (10)
  }

  return canvas.toBuffer("image/png");
}
