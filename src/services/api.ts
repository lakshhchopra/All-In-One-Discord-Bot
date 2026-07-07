import express from "express";
import cors from "cors";
import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { prisma } from "./db.js";
import { config } from "../config/index.js";

const app = express();
app.use(cors());
app.use(express.json());

// REST Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", uptime: process.uptime() });
});

// Get Guild config settings
app.get("/api/guilds/:guildId", async (req, res) => {
  const { guildId } = req.params;
  try {
    const guildConfig = await prisma.guildConfig.findUnique({
      where: { guildId }
    });
    if (!guildConfig) {
      return res.status(404).json({ error: "Guild configuration not found." });
    }
    res.json(guildConfig);
  } catch (err) {
    res.status(500).json({ error: "Internal server error." });
  }
});

// Update Guild config settings
app.post("/api/guilds/:guildId", async (req, res) => {
  const { guildId } = req.params;
  const data = req.body;
  try {
    // Basic verification on structure
    delete data.guildId;
    delete data.createdAt;
    delete data.updatedAt;

    const updated = await prisma.guildConfig.upsert({
      where: { guildId },
      update: data,
      create: { guildId, ...data }
    });

    // Notify connected websockets about the config update
    broadcast({ type: "CONFIG_UPDATE", guildId, data: updated });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to update configuration." });
  }
});

// Get global statistics
app.get("/api/stats", async (req, res) => {
  try {
    const guildsCount = await prisma.guildConfig.count();
    const messagesCount = await prisma.memberStats.aggregate({
      _sum: { totalMessages: true }
    });
    res.json({
      guilds: guildsCount,
      totalMessages: messagesCount._sum.totalMessages ?? 0
    });
  } catch {
    res.status(500).json({ error: "Failed to load statistics." });
  }
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const clients = new Set<WebSocket>();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.send(JSON.stringify({ type: "HELLO", uptime: process.uptime() }));

  ws.on("close", () => {
    clients.delete(ws);
  });
});

export function broadcast(msg: any) {
  const payload = JSON.stringify(msg);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}

export function startApiServer() {
  server.listen(config.PORT, () => {
    console.log(`📡 API & WebSocket Server running on port ${config.PORT}`);
  });
}
