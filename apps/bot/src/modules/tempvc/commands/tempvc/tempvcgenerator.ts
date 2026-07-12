import { Command } from "../../../../commands/command.js";
import { ChannelType } from "discord.js";
import { prisma } from "../../../../services/db.js";
import { UniversalEmbed } from "../../../../services/embed.js";
import { hasPermission } from "../../../../commands/permissions.js";

export const tempvcgeneratorCommand: Command = {
  name: "tempvcgenerator",
  aliases: ["tempvc generator"],
  description: "Manage temporary voice channel generators.",
  category: "Temporary Voice",
  permissionLevel: "ADMIN",
  usage: "tempvc generator <add | remove | list>",
  execute: async (ctx: any) => {
    const isAdmin = await hasPermission(ctx.member, "ADMIN");
    if (!isAdmin) {
      return ctx.reply({ embeds: [UniversalEmbed.error("You need Administrator permissions to configure temporary voice channels.", ctx.guild)] }, 5);
    }

    const subAction = ctx.getStringOption("subaction", 0)?.toLowerCase();

    if (subAction === "add") {
      const vCh = ctx.getChannelOption("channel", 1);
      if (!vCh || vCh.type !== ChannelType.GuildVoice) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Usage: \`${ctx.prefix}tempvc generator add <voiceCh> <limit> <nameTemplate> [category]\``, ctx.guild)] }, 5);
      }

      const limit = ctx.getIntegerOption("limit", 2);
      if (limit === null || limit < 0 || limit > 99) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid default user limit (0-99).", ctx.guild)] }, 5);
      }

      let nameTemplate = "";
      let categoryId: string | null = null;
      
      const remainingArgs = ctx.args.slice(3);
      if (remainingArgs.length > 0) {
        const lastArg = remainingArgs[remainingArgs.length - 1];
        const categoryMatch = lastArg.match(/^<#(\d+)>$/) || lastArg.match(/^(\d{17,20})$/);
        if (categoryMatch) {
          categoryId = categoryMatch[1];
          nameTemplate = remainingArgs.slice(0, -1).join(" ");
        } else {
          nameTemplate = remainingArgs.join(" ");
        }
      }

      if (!nameTemplate) {
        nameTemplate = "{username}'s Channel";
      }

      // Verify category if specified
      if (categoryId) {
        const catChannel = ctx.guild.channels.cache.get(categoryId);
        if (!catChannel || catChannel.type !== ChannelType.GuildCategory) {
          return ctx.reply({ embeds: [UniversalEmbed.error("The specified category channel ID/mention is invalid.", ctx.guild)] }, 5);
        }
      }

      await (prisma as any).tempVCGenerator.upsert({
        where: { channelId: vCh.id },
        update: {
          nameTemplate,
          userLimit: limit,
          categoryId
        },
        create: {
          channelId: vCh.id,
          guildId: ctx.guild.id,
          nameTemplate,
          userLimit: limit,
          categoryId
        }
      });

      return ctx.reply({
        embeds: [UniversalEmbed.success(
          `Successfully registered generator **${vCh.name}**!\n` +
          `• Default Limit: \`${limit === 0 ? "Unlimited" : limit}\`\n` +
          `• Name Template: \`${nameTemplate}\`\n` +
          `• Target Category: ${categoryId ? `<#${categoryId}>` : "Default (Generator's Parent)"}`,
          ctx.guild
        )]
      });
    }

    if (subAction === "remove" || subAction === "delete") {
      const vCh = ctx.getChannelOption("channel", 1);
      if (!vCh) {
        return ctx.reply({ embeds: [UniversalEmbed.error(`Usage: \`${ctx.prefix}tempvc generator remove <voiceCh>\``, ctx.guild)] }, 5);
      }

      const existing = await (prisma as any).tempVCGenerator.findUnique({
        where: { channelId: vCh.id }
      });

      if (!existing) {
        return ctx.reply({ embeds: [UniversalEmbed.error("That channel is not a registered temporary voice generator.", ctx.guild)] }, 5);
      }

      await (prisma as any).tempVCGenerator.delete({
        where: { channelId: vCh.id }
      });

      return ctx.reply({ embeds: [UniversalEmbed.success(`Removed **${vCh.name}** from temporary voice generators.`, ctx.guild)] });
    }

    if (subAction === "list") {
      const list = await (prisma as any).tempVCGenerator.findMany({
        where: { guildId: ctx.guild.id }
      });

      if (list.length === 0) {
        return ctx.reply({ embeds: [UniversalEmbed.info("There are no voice generators registered on this server.", ctx.guild)] });
      }

      const desc = list.map((gen: any, idx: number) => {
        const catVal = gen.categoryId ? `<#${gen.categoryId}>` : "*None (Default category)*";
        const limitVal = gen.userLimit === 0 ? "Unlimited" : `\`${gen.userLimit} Users\``;
        return `**#${idx + 1} ・ <#${gen.channelId}>**\n` +
               `> 📂 **Category:** ${catVal}\n` +
               `> 📝 **Template:** \`${gen.nameTemplate}\`\n` +
               `> 👥 **Limit:** ${limitVal}`;
      }).join("\n\n");

      const embed = new UniversalEmbed("info", undefined, ctx.guild)
        .setTitle("🔊 Temp VC Generators")
        .setDescription(desc);

      return ctx.reply({ embeds: [embed] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.error(`Invalid generator action. Use: \`add\`, \`remove\`, \`list\``, ctx.guild)] }, 5);
  }
};

