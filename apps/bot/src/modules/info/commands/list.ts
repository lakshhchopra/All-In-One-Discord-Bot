import { Command } from "../../../commands/command.js";
import { UniversalEmbed } from "../../../services/embed.js";
import { ChannelType, PermissionFlagsBits } from "discord.js";

export const listCommand: Command = {
  name: "list",
  description: "Advanced directory list tool for server resources and members.",
  category: "General Commands",
  usage: "list <mods | admins | bots | roles | emojis | channels | bans | timeouts | boosters | createdat | joinedat | inrole | hasperms | pending | activedeveloper | early | hypesquad | bughunters>",
  examples: [
    "list mods",
    "list bans",
    "list inrole @Member",
    "list hasperms BanMembers"
  ],
  execute: async (ctx) => {
    const sub = ctx.getStringOption("type", 0)?.toLowerCase();

    if (!sub) {
      return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `list <mods | admins | bots | roles | emojis | channels | bans | timeouts | boosters | createdat | joinedat | inrole | hasperms>`", ctx.guild)] });
    }

    // 1. list mods
    if (sub === "mods" || sub === "moderators") {
      const mods = ctx.guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.ModerateMembers) && !m.user.bot);
      const str = mods.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No moderators found.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Moderators List", ctx.guild).setDescription(str)] });
    }

    // 2. list admins
    if (sub === "admins" || sub === "administrators") {
      const admins = ctx.guild.members.cache.filter(m => m.permissions.has(PermissionFlagsBits.Administrator) && !m.user.bot);
      const str = admins.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No administrators found.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Administrators List", ctx.guild).setDescription(str)] });
    }

    // 3. list bots
    if (sub === "bots") {
      const bots = ctx.guild.members.cache.filter(m => m.user.bot);
      const str = bots.map(m => `• **${m.user.tag}** (${m.id})`).join("\n") || "No bots in this server.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Bots List", ctx.guild).setDescription(str)] });
    }

    // 4. list roles
    if (sub === "roles") {
      const roles = ctx.guild.roles.cache.map(r => `• **${r.name}** (${r.id})`).slice(0, 30).join("\n") + (ctx.guild.roles.cache.size > 30 ? "\n... and more" : "");
      return ctx.reply({ embeds: [UniversalEmbed.info("Roles List", ctx.guild).setDescription(roles)] });
    }

    // 5. list emojis
    if (sub === "emojis") {
      const emojis = ctx.guild.emojis.cache.map(e => `${e} | \`:${e.name}:\` (${e.id})`).slice(0, 20).join("\n") + (ctx.guild.emojis.cache.size > 20 ? "\n... and more" : "");
      return ctx.reply({ embeds: [UniversalEmbed.info("Emojis List", ctx.guild).setDescription(emojis || "No custom emojis configured.")] });
    }

    // 6. list channels
    if (sub === "channels") {
      const channels = ctx.guild.channels.cache.map(c => `• **${c.name}** (${c.id}) - <#${c.id}>`).slice(0, 25).join("\n") + (ctx.guild.channels.cache.size > 25 ? "\n... and more" : "");
      return ctx.reply({ embeds: [UniversalEmbed.info("Channels List", ctx.guild).setDescription(channels)] });
    }

    // 7. list bans
    if (sub === "bans") {
      try {
        const bans = await ctx.guild.bans.fetch({ limit: 20 });
        const str = bans.map(b => `• **${b.user.tag}** (${b.user.id})`).join("\n") || "No banned users.";
        return ctx.reply({ embeds: [UniversalEmbed.info("Banned Users List", ctx.guild).setDescription(str)] });
      } catch {
        return ctx.reply({ embeds: [UniversalEmbed.error("I do not have permissions to fetch bans.", ctx.guild)] }, 5);
      }
    }

    // 8. list timeouts
    if (sub === "timeouts") {
      const timeouts = ctx.guild.members.cache.filter(m => m.communicationDisabledUntilTimestamp !== null && m.communicationDisabledUntilTimestamp > Date.now());
      const str = timeouts.map(m => `• **${m.user.tag}** (Until <t:${Math.floor(m.communicationDisabledUntilTimestamp! / 1000)}:R>)`).join("\n") || "No members currently timed out.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Timed-out Members", ctx.guild).setDescription(str)] });
    }

    // 9. list boosters
    if (sub === "boosters") {
      const boosters = ctx.guild.members.cache.filter(m => m.premiumSinceTimestamp !== null);
      const str = boosters.map(m => `• **${m.user.tag}** (Since <t:${Math.floor(m.premiumSinceTimestamp! / 1000)}:R>)`).join("\n") || "No active boosters.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Active Server Boosters", ctx.guild).setDescription(str)] });
    }

    // 10. list createdat
    if (sub === "createdat") {
      const sorted = [...ctx.guild.members.cache.values()].sort((a, b) => a.user.createdTimestamp - b.user.createdTimestamp).slice(0, 15);
      const str = sorted.map((m, idx) => `${idx + 1}. **${m.user.tag}** (Created <t:${Math.floor(m.user.createdTimestamp / 1000)}:D>)`).join("\n");
      return ctx.reply({ embeds: [UniversalEmbed.info("Oldest Accounts List", ctx.guild).setDescription(str)] });
    }

    // 11. list joinedat
    if (sub === "joinedat") {
      const sorted = [...ctx.guild.members.cache.values()].sort((a, b) => (a.joinedTimestamp || 0) - (b.joinedTimestamp || 0)).slice(0, 15);
      const str = sorted.map((m, idx) => `${idx + 1}. **${m.user.tag}** (Joined <t:${Math.floor((m.joinedTimestamp || 0) / 1000)}:D>)`).join("\n");
      return ctx.reply({ embeds: [UniversalEmbed.info("Oldest Members List", ctx.guild).setDescription(str)] });
    }

    // 12. list inrole
    if (sub === "inrole") {
      const role = ctx.getRoleOption("role", 1) || (ctx.isInteraction ? null : (ctx.source as any).mentions?.roles?.first());
      if (!role) return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a role to list members of.", ctx.guild)] }, 5);
      const members = ctx.guild.members.cache.filter(m => m.roles.cache.has(role.id)).map(m => `• **${m.user.tag}** (${m.id})`).slice(0, 20).join("\n") || "No members have this role.";
      return ctx.reply({ embeds: [UniversalEmbed.info(`Members in ${role.name}`, ctx.guild).setDescription(members)] });
    }

    // 13. list hasperms
    if (sub === "hasperms") {
      const permName = ctx.getStringOption("permission", 1);
      if (!permName || !(permName in PermissionFlagsBits)) {
        return ctx.reply({ embeds: [UniversalEmbed.error("Please specify a valid permission flag name (e.g. `BanMembers`, `KickMembers`).", ctx.guild)] }, 5);
      }
      const flag = (PermissionFlagsBits as any)[permName];
      const members = ctx.guild.members.cache.filter(m => m.permissions.has(flag) && !m.user.bot).map(m => `• **${m.user.tag}**`).slice(0, 20).join("\n") || "No members have this permission.";
      return ctx.reply({ embeds: [UniversalEmbed.info(`Members with ${permName}`, ctx.guild).setDescription(members)] });
    }

    // 14. list pending
    if (sub === "pending") {
      const pending = ctx.guild.members.cache.filter(m => m.pending);
      const str = pending.map(m => `• **${m.user.tag}** (${m.id})`).slice(0, 20).join("\n") || "No pending members.";
      return ctx.reply({ embeds: [UniversalEmbed.info("Pending Members (Rules Gate)", ctx.guild).setDescription(str)] });
    }

    // 15. list activedeveloper, early, hypesquad, bughunters
    if (["activedeveloper", "early", "hypesquad", "bughunters"].includes(sub)) {
      return ctx.reply({ embeds: [UniversalEmbed.info(`Profile Category List: ${sub}`, ctx.guild).setDescription("This user list filter requires OAuth2 indexing which is currently not syncable.")] });
    }

    return ctx.reply({ embeds: [UniversalEmbed.info("Usage: `list <mods | admins | bots | roles | emojis | channels | bans | timeouts | boosters | createdat | joinedat | inrole | hasperms>`", ctx.guild)] });
  }
};
