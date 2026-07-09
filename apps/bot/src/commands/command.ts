import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { CommandContext } from "./context.js";
import { PermissionLevel, hasPermission } from "./permissions.js";
import { redis } from "../services/redis.js";
import { UniversalEmbed } from "../services/embed.js";
import { sendSupportLog } from "../utils/supportLogger.js";

export interface Command {
  name: string;
  description: string;
  category: string;
  aliases?: string[];
  permissionLevel?: PermissionLevel;
  cooldown?: number; // In seconds
  usage?: string;
  examples?: string[];
  slashBuilder?: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute(ctx: CommandContext): Promise<any>;
}

function getStandardCategory(cmd: Command): string {
  const name = cmd.name.toLowerCase();
  const cat = cmd.category?.toLowerCase() || "";

  if (name === "automod" || name === "blword") return "Antinuke & Automod";
  if (name === "antinuke" || name === "antiraid" || name === "whitelist" || name === "mainrole" || name === "panicmode" || name === "extraowner" || name === "trusted" || name === "ignore") return "Security";
  if (cat === "welcome" || cat === "welcomer" || cat === "welcomer module") return "Welcomer Module";
  if (cat === "embeds" || name === "embed" || name === "variables") return "Embed System";
  if (cat === "utility" || name === "reactionrole" || name === "autoresponder" || name === "autoreact" || name === "sticky") return "Utility";
  if (cat === "tempvc" || cat === "voicemaster" || cat === "temp voice" || cat === "voice master") return "Voice Master";
  if (name === "prefix" || name === "noprefix" || name === "info" || name === "status" || name === "ping" || name === "botinfo" || name === "aboutdev") return "Bot Info";
  if (cat === "ticket" || cat === "tickets") return "Ticket";
  if (cat === "messages" || cat === "invites" || cat === "messagings & invites" || name === "message" || name === "dailymessage" || name === "inv") return "Messagings & Invites";
  if (cat === "logging" || cat === "loggings") return "Loggings";
  if (cat === "configuration" || cat === "general" || cat === "general commands") return "General Commands";
  if (cat === "moderation" || cat === "voicemod") return "Moderation";
  if (cat === "giveaway" || cat === "giveaways") return "Giveaways";
  if (cat === "games" || cat === "minigames" || cat === "mini games") return "Mini Games";
  
  return "General Commands";
}

export class CommandRegistry {
  private static commands = new Map<string, Command>();
  private static aliases = new Map<string, string>();

  static register(command: Command) {
    command.category = getStandardCategory(command);
    this.commands.set(command.name.toLowerCase(), command);
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
      }
    }
  }

  static get(name: string): Command | undefined {
    const mainName = this.commands.has(name.toLowerCase())
      ? name.toLowerCase()
      : this.aliases.get(name.toLowerCase());
    if (mainName) {
      return this.commands.get(mainName);
    }
    return undefined;
  }

  static getAll(): Command[] {
    return Array.from(this.commands.values());
  }
}

export async function handleCommand(ctx: CommandContext, commandName: string) {
  const command = CommandRegistry.get(commandName);
  if (!command) return;

  // Pre-fetch non-cached members mentioned by ID or mention in prefix command arguments
  if (!ctx.isInteraction && ctx.args.length > 0) {
    for (const arg of ctx.args) {
      const match = arg.match(/^<@!?(\d+)>$/) || arg.match(/^(\d{17,20})$/);
      if (match) {
        const userId = match[1];
        if (!ctx.guild.members.cache.has(userId)) {
          await ctx.guild.members.fetch(userId).catch(() => null);
        }
      }
    }
  }

  // 1. Permission check
  if (command.permissionLevel) {
    const allowed = await hasPermission(ctx.member, command.permissionLevel);
    if (!allowed) {
      await ctx.reply(
        { embeds: [UniversalEmbed.error(`You do not have permission to use this command. Required: ${command.permissionLevel}`, ctx.guild)] },
        5
      );
      return;
    }
  }

  // 2. Cooldown check using Redis
  const cooldownSec = command.cooldown ?? 3;
  const cooldownKey = `cooldown:${ctx.guild.id}:${ctx.member.id}:${command.name}`;
  const currentCooldown = await redis.get(cooldownKey);

  if (currentCooldown) {
    const ttl = await redis.ttl(cooldownKey);
    await ctx.reply(
      { embeds: [UniversalEmbed.warning(`This command is on cooldown. Please wait ${ttl} second(s).`, ctx.guild)] },
      3
    );
    return;
  }

  // Set cooldown
  await redis.setex(cooldownKey, cooldownSec, "1");

  // 3. Execute
  try {
    await command.execute(ctx);

    // Support Log
    try {
      const logEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle("💬 Command Executed")
        .setDescription(
          `- **Command:** \`${command.name}\`\n` +
          `- **User:** ${ctx.user.tag} (${ctx.user.id})\n` +
          `- **Channel:** #${(ctx.channel as any).name || ctx.channel?.id || "DM"} (${ctx.channel?.id || "N/A"})\n` +
          `- **Guild:** ${ctx.guild?.name || "DM"} (${ctx.guild?.id || "N/A"})`
        )
        .setTimestamp();
      await sendSupportLog(ctx.client, "command", logEmbed);
    } catch (logErr) {
      console.error("Failed to send command support log:", logErr);
    }
  } catch (error) {
    console.error(`❌ Error executing command ${command.name}:`, error);
    try {
      await ctx.reply(
        { embeds: [UniversalEmbed.error("An error occurred while executing this command. Please try again later.", ctx.guild)] },
        5
      );
    } catch {
      // Ignore if reply failed
    }
  }
}
