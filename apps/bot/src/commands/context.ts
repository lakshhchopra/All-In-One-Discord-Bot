import {
  ChatInputCommandInteraction,
  Client,
  Message,
  Guild,
  GuildMember,
  User,
  TextBasedChannel,
  InteractionReplyOptions,
  MessageCreateOptions
} from "discord.js";
import { prisma } from "../services/db.js";
import { UniversalEmbed } from "../services/embed.js";

export class CommandContext {
  public readonly isInteraction: boolean;
  public readonly guild: Guild;
  public readonly member: GuildMember;
  public readonly user: User;
  public readonly channel: TextBasedChannel;
  public readonly client: Client;
  public readonly args: string[];
  public prefix: string = "-";
  public commandName: string = "";

  constructor(
    public readonly source: Message | ChatInputCommandInteraction,
    args: string[] = []
  ) {
    this.isInteraction = source instanceof ChatInputCommandInteraction;
    this.guild = source.guild as Guild;
    this.member = source.member as GuildMember;
    this.user = this.isInteraction
      ? (source as ChatInputCommandInteraction).user
      : (source as Message).author;
    this.channel = source.channel!;
    this.client = source.client;
    this.args = args;
    if (this.isInteraction) {
      this.commandName = (source as ChatInputCommandInteraction).commandName;
    }
  }

  async initPrefix() {
    const config = await prisma.guildConfig.findUnique({
      where: { guildId: this.guild.id }
    });
    if (config) {
      this.prefix = config.prefix;
    }
  }

  async reply(
    content: string | InteractionReplyOptions | MessageCreateOptions,
    autoDeleteSeconds?: number
  ) {
    let responseMessage: Message | null = null;

    if (this.isInteraction) {
      const interaction = this.source as ChatInputCommandInteraction;
      const payload = typeof content === "string" ? { content } : (content as InteractionReplyOptions);
      
      if (interaction.deferred || interaction.replied) {
        const msg = await interaction.followUp({ ...payload, fetchReply: true });
        responseMessage = msg as Message;
      } else {
        const msg = await interaction.reply({ ...payload, fetchReply: true });
        responseMessage = msg as Message;
      }
    } else {
      const message = this.source as Message;
      const payload = typeof content === "string" ? { content } : (content as MessageCreateOptions);
      const cleanPayload = { ...payload } as any;
      if ("ephemeral" in cleanPayload) {
        delete cleanPayload.ephemeral;
      }
      try {
        responseMessage = await message.reply(cleanPayload);
      } catch {
        try {
          responseMessage = await (message.channel as any).send(cleanPayload);
        } catch {}
      }
    }

    if (autoDeleteSeconds && responseMessage) {
      setTimeout(async () => {
        try {
          await responseMessage?.delete();
        } catch {
          // Message already deleted or permissions missing
        }
      }, autoDeleteSeconds * 1000);
    }

    return responseMessage;
  }

  // Get argument by index (for prefix commands) or option by name (for slash commands)
  getStringOption(name: string, index: number): string | null {
    if (this.isInteraction) {
      const interaction = this.source as ChatInputCommandInteraction;
      return interaction.options.getString(name);
    }
    return this.args[index] || null;
  }

  getMemberOption(name: string, index: number): GuildMember | null {
    if (this.isInteraction) {
      const interaction = this.source as ChatInputCommandInteraction;
      return interaction.options.getMember(name) as GuildMember | null;
    }
    const arg = this.args[index];
    if (!arg) return null;
    const match = arg.match(/^<@!?(\d+)>$/) || arg.match(/^(\d+)$/);
    if (!match) return null;
    const memberId = match[1];
    return this.guild.members.cache.get(memberId) || null;
  }

  getChannelOption(name: string, index: number) {
    if (this.isInteraction) {
      const interaction = this.source as ChatInputCommandInteraction;
      return interaction.options.getChannel(name);
    }
    const arg = this.args[index];
    if (!arg) return null;
    const match = arg.match(/^<#(\d+)>$/) || arg.match(/^(\d+)$/);
    if (!match) return null;
    const channelId = match[1];
    return this.guild.channels.cache.get(channelId) || null;
  }

  getRoleOption(name: string, index: number, rest: boolean = false) {
    if (this.isInteraction) {
      const interaction = this.source as ChatInputCommandInteraction;
      return interaction.options.getRole(name);
    }
    const arg = rest ? this.args.slice(index).join(" ") : this.args[index];
    if (!arg) return null;

    // 1. Try mention <@&id>
    const mentionMatch = arg.match(/^<@&(\d+)>$/);
    if (mentionMatch) return this.guild.roles.cache.get(mentionMatch[1]) || null;

    // 2. Try raw ID
    const idMatch = arg.match(/^(\d{17,19})$/);
    if (idMatch) return this.guild.roles.cache.get(idMatch[1]) || null;

    // 3. Fall back to name search (case-insensitive, partial match)
    const query = arg.toLowerCase();
    return this.guild.roles.cache.find(r => r.name.toLowerCase() === query)
      || this.guild.roles.cache.find(r => r.name.toLowerCase().includes(query))
      || null;
  }


  getIntegerOption(name: string, index: number): number | null {
    if (this.isInteraction) {
      const interaction = this.source as ChatInputCommandInteraction;
      return interaction.options.getInteger(name);
    }
    const val = parseInt(this.args[index], 10);
    return isNaN(val) ? null : val;
  }

  wrongUsage(command: { name: string; usage?: string; examples?: string[] }) {
    return this.reply({
      embeds: [
        UniversalEmbed.error(
          `**Usage:** \`${this.prefix}${command.usage || command.name}\`\n**Example:** \`${this.prefix}${command.examples?.[0] || command.name}\``,
          this.guild
        )
      ]
    }, 5);
  }
}
