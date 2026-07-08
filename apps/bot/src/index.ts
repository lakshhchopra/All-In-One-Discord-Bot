import { Client, GatewayIntentBits, Events, ActivityType } from "discord.js";
import { config } from "./config/index.js";
import { connectDatabase } from "./services/db.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleVoiceStateUpdate } from "./events/voiceStateUpdate.js";
import { handleGuildCreate } from "./events/guildCreate.js";
import { registerConfiguration } from "./modules/configuration/commands.js";
import { registerWelcome } from "./modules/welcome/commands.js";
import { registerModeration } from "./modules/moderation/commands.js";
import { registerTempVc } from "./modules/tempvc/commands.js";
import { registerVoiceMod } from "./modules/voicemod/commands.js";
import { registerExtras } from "./modules/embeds/commands.js";
import { registerLogging } from "./modules/logging/commands.js";
import { registerSecurity } from "./modules/security/commands.js";
import { registerAntiRaid } from "./modules/antiraid/commands.js";
import { registerInvites } from "./modules/invites/commands.js";
import { registerMessages } from "./modules/messages/commands.js";
import { registerGiveaway } from "./modules/giveaway/commands.js";
import { registerGames } from "./modules/games/commands.js";
import { registerInfo } from "./modules/info/commands.js";
import { startGiveawayScheduler } from "./modules/giveaway/scheduler.js";

// Initialize Discord Client with appropriate intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions
  ]
});

// Register Commands across all modules
registerConfiguration();
registerWelcome();
registerModeration();
registerTempVc();
registerVoiceMod();
registerExtras();
registerLogging();
registerSecurity();
registerAntiRaid();
registerInvites();
registerMessages();
registerGiveaway();
registerGames();
registerInfo();

function updateBotPresence(readyClient: any) {
  try {
    const totalMembers = readyClient.guilds.cache.reduce((acc: number, guild: any) => acc + guild.memberCount, 0);
    const guild = readyClient.guilds.cache.get("1126413930105950279") || readyClient.guilds.cache.first();

    readyClient.user.setPresence({
      activities: [{
        name: "🦋. Gupshup",
        type: ActivityType.Listening,
        details: "discord.gg/gupshup",
        state: `${totalMembers} members`,
        assets: {
          largeText: "Gupshup"
        }
      }],
      status: "online"
    });
  } catch (err) {
    console.error("⚠️ Failed to update bot presence:", err);
  }
}

client.once(Events.ClientReady, async (readyClient) => {
  console.log(`🤖 Discord Bot logged in as ${readyClient.user.tag}`);

  // 1. Set bot activity presence and start update interval
  updateBotPresence(readyClient);
  setInterval(() => updateBotPresence(readyClient), 10 * 60 * 1000);

  // 2. Start giveaway auto-end scheduler
  startGiveawayScheduler(readyClient);
});

// Register Event Listeners
client.on(Events.MessageCreate, handleMessageCreate);
client.on(Events.InteractionCreate, handleInteractionCreate);
client.on(Events.GuildMemberAdd, handleGuildMemberAdd);
client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);
client.on(Events.GuildCreate, handleGuildCreate);

async function bootstrap() {
  // 1. Connect database
  await connectDatabase();

  // 2. Login to Discord
  if (config.DISCORD_TOKEN !== "your_bot_token_here") {
    await client.login(config.DISCORD_TOKEN);
  } else {
    console.log("⚠️ DISCORD_TOKEN is set to default placeholder. Bot login bypassed.");
  }
}

bootstrap().catch((err) => {
  console.error("❌ Fatal Error during bootstrap:", err);
  process.exit(1);
});
