import { SlashCommandBuilder } from "discord.js";
import { CommandContext } from "./context.js";
import { PermissionLevel, hasPermission } from "./permissions.js";
import { redis } from "../services/redis.js";
import { UniversalEmbed } from "../services/embed.js";

export interface Command {
  name: string;
  description: string;
  category: string;
  aliases?: string[];
  permissionLevel?: PermissionLevel;
  cooldown?: number; // In seconds
  slashBuilder?: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute(ctx: CommandContext): Promise<any>;
}

export class CommandRegistry {
  private static commands = new Map<string, Command>();
  private static aliases = new Map<string, string>();

  static register(command: Command) {
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
