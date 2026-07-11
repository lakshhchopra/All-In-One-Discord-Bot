import { Client, GatewayIntentBits, Events, ActivityType, Partials } from "discord.js";
import { config } from "./config/index.js";
import { loadApplicationEmojis } from "./config/emojis.js";
import { connectDatabase } from "./services/db.js";
import { handleMessageCreate } from "./events/messageCreate.js";
import { initInviteTracker, cacheGuildInvites } from "./services/invites.js";
import { handleInteractionCreate } from "./events/interactionCreate.js";
import { handleGuildMemberAdd } from "./events/guildMemberAdd.js";
import { handleVoiceStateUpdate } from "./events/voiceStateUpdate.js";
import { handleGuildCreate } from "./events/guildCreate.js";
import { handleChannelDelete } from "./events/channelDelete.js";
import { handleChannelCreate } from "./events/channelCreate.js";
import { handleGuildBanAdd } from "./events/guildBanAdd.js";
import { handleGuildMemberRemove } from "./events/guildMemberRemove.js";
import { handleRoleCreate } from "./events/roleCreate.js";
import { handleRoleDelete } from "./events/roleDelete.js";
import { handleRoleUpdate } from "./events/roleUpdate.js";
import { handleGuildMemberUpdate } from "./events/guildMemberUpdate.js";
import { handleMessageReactionAdd } from "./events/messageReactionAdd.js";
import { handleMessageReactionRemove } from "./events/messageReactionRemove.js";
import { registerConfiguration } from "./modules/configuration/commands.js";
import { registerWelcome } from "./modules/welcome/commands.js";
import { registerModeration } from "./modules/moderation/commands.js";
import { registerTempVc } from "./modules/tempvc/commands.js";
import { registerVoiceMod } from "./modules/voicemod/commands.js";
import { registerExtras } from "./modules/embeds/commands.js";
import { registerUtility } from "./modules/utility/commands.js";
import { registerLogging } from "./modules/logging/commands.js";
import { registerSecurity } from "./modules/security/commands.js";
import { registerAntiRaid } from "./modules/antiraid/commands.js";
import { registerInvitesMessages } from "./modules/invites-messages/commands.js";
import { registerGiveaway } from "./modules/giveaway/commands.js";
import { registerGames } from "./modules/games/commands.js";
import { registerInfo } from "./modules/info/commands.js";
import { registerTickets } from "./modules/tickets/commands.js";
import { startGiveawayScheduler } from "./modules/giveaway/scheduler.js";

// Gupshup - The Ultimate All-In-One Discord Bot
// Initialize Discord Client with appropriate intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration
  ],
  partials: [Partials.Message, Partials.Reaction, Partials.User]
});

// Register Commands across all modules
registerConfiguration();
registerWelcome();
registerModeration();
registerTempVc();
registerVoiceMod();
registerExtras();
registerUtility();
registerLogging();
registerSecurity();
registerAntiRaid();
registerInvitesMessages();
registerGiveaway();
registerGames();
registerInfo();
registerTickets();

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

  // Load application emojis dynamically from the developer portal
  await loadApplicationEmojis(readyClient);

  // 1. Set bot activity presence and start update interval
  updateBotPresence(readyClient);
  setInterval(() => updateBotPresence(readyClient), 10 * 60 * 1000);

  // 2. Start giveaway auto-end scheduler
  startGiveawayScheduler(readyClient);

  // 3. Initialize invites tracker cache
  await initInviteTracker(readyClient);
});

// Register Event Listeners
client.on(Events.MessageCreate, handleMessageCreate);
client.on(Events.InteractionCreate, handleInteractionCreate);
client.on(Events.GuildMemberAdd, handleGuildMemberAdd);
client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);
client.on(Events.GuildCreate, (guild) => {
  handleGuildCreate(guild);
  cacheGuildInvites(guild);
});
client.on(Events.InviteCreate, (invite) => {
  if (invite.guild) cacheGuildInvites(invite.guild as any);
});
client.on(Events.InviteDelete, (invite) => {
  if (invite.guild) cacheGuildInvites(invite.guild as any);
});
client.on(Events.MessageReactionAdd, handleMessageReactionAdd);
client.on(Events.MessageReactionRemove, handleMessageReactionRemove);
client.on(Events.ChannelDelete, handleChannelDelete);
client.on(Events.ChannelCreate, handleChannelCreate);
client.on(Events.GuildBanAdd, handleGuildBanAdd);
client.on(Events.GuildMemberRemove, handleGuildMemberRemove);
client.on(Events.GuildRoleCreate, handleRoleCreate);
client.on(Events.GuildRoleDelete, handleRoleDelete);
client.on(Events.GuildRoleUpdate, handleRoleUpdate);
client.on(Events.GuildMemberUpdate, (oldMember, newMember) => {
  if (oldMember.partial) return;
  return handleGuildMemberUpdate(oldMember as any, newMember as any);
});

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
