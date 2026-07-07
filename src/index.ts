import { Client, GatewayIntentBits, Events } from "discord.js";
import { config } from "./config/index.js";
import { connectDatabase } from "./services/db.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleVoiceStateUpdate } from "./events/voiceStateUpdate.js";
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
import { startApiServer } from "./services/api.js";

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

client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Discord Bot logged in as ${readyClient.user.tag}`);
});

// Register Event Listeners
client.on(Events.MessageCreate, handleMessageCreate);
client.on(Events.InteractionCreate, handleInteractionCreate);
client.on(Events.GuildMemberAdd, handleGuildMemberAdd);
client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

async function bootstrap() {
  // 1. Connect database
  await connectDatabase();

  // 2. Start Web Server
  startApiServer();

  // 3. Login to Discord
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
