import { query } from "@/lib/db";

export type GuildConfig = {
  guildId: string;
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  welcomeType: string;
  logChannelId: string | null;
  logEnabled: boolean;
  logToggles: Record<string, any>;
  antiRaidEnabled: boolean;
  antiRaidJoinsLimit: number;
  antiRaidJoinsWindow: number;
  antiNukeEnabled: boolean;
  ticketCategoryId: string | null;
  supportRoleId: string | null;
  accentColor: number;
  updatedAt: string | null;
};

type GuildConfigRow = {
  guildId: string;
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  welcomeType: string | null;
  logChannelId: string | null;
  logEnabled: boolean | null;
  logToggles: any | null;
  antiRaidEnabled: boolean | null;
  antiRaidJoinsLimit: number | null;
  antiRaidJoinsWindow: number | null;
  antiNukeEnabled: boolean | null;
  accentColor: number | null;
  updatedAt: string | null;
};

export type GuildConfigPatch = Partial<Omit<GuildConfig, "guildId" | "updatedAt">>;

const defaultWelcome = "Welcome {user} to {server}. You are member #{count}.";

function fallback(guildId: string): GuildConfig {
  return {
    guildId,
    welcomeChannelId: null,
    welcomeMessage: defaultWelcome,
    welcomeType: "both",
    logChannelId: null,
    logEnabled: false,
    logToggles: {},
    antiRaidEnabled: false,
    antiRaidJoinsLimit: 10,
    antiRaidJoinsWindow: 15,
    antiNukeEnabled: false,
    ticketCategoryId: null,
    supportRoleId: null,
    accentColor: 0x38dff8,
    updatedAt: null
  };
}

function toConfig(
  row: GuildConfigRow | undefined, 
  guildId: string, 
  ticketRow?: { categoryId: string | null; supportRoleId: string | null }
): GuildConfig {
  const base = fallback(guildId);
  if (!row) return base;

  return {
    guildId: row.guildId,
    welcomeChannelId: row.welcomeChannelId,
    welcomeMessage: row.welcomeMessage ?? base.welcomeMessage,
    welcomeType: row.welcomeType ?? base.welcomeType,
    logChannelId: row.logChannelId,
    logEnabled: row.logEnabled ?? base.logEnabled,
    logToggles: row.logToggles ?? base.logToggles,
    antiRaidEnabled: row.antiRaidEnabled ?? base.antiRaidEnabled,
    antiRaidJoinsLimit: row.antiRaidJoinsLimit ?? base.antiRaidJoinsLimit,
    antiRaidJoinsWindow: row.antiRaidJoinsWindow ?? base.antiRaidJoinsWindow,
    antiNukeEnabled: row.antiNukeEnabled ?? base.antiNukeEnabled,
    ticketCategoryId: ticketRow?.categoryId ?? null,
    supportRoleId: ticketRow?.supportRoleId ?? null,
    accentColor: row.accentColor ?? base.accentColor,
    updatedAt: row.updatedAt
  };
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanColor(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0x38dff8;
  return Math.max(0, Math.min(0xffffff, Math.round(value)));
}

export async function getGuildConfig(guildId: string) {
  const result = await query<GuildConfigRow>('select * from public."GuildConfig" where "guildId" = $1', [guildId]);
  const ticketResult = await query<{ categoryId: string | null; supportRoleId: string | null }>(
    'select "categoryId", "supportRoleId" from public."TicketConfig" where "guildId" = $1',
    [guildId]
  );
  return toConfig(result.rows[0], guildId, ticketResult.rows[0]);
}

export async function updateGuildConfig(guildId: string, patch: GuildConfigPatch) {
  const current = await getGuildConfig(guildId);
  const next: GuildConfig = {
    ...current,
    ...patch,
    guildId,
    welcomeChannelId: cleanString(patch.welcomeChannelId ?? current.welcomeChannelId),
    welcomeMessage: cleanString(patch.welcomeMessage ?? current.welcomeMessage) ?? defaultWelcome,
    welcomeType: cleanString(patch.welcomeType ?? current.welcomeType) ?? "both",
    logChannelId: cleanString(patch.logChannelId ?? current.logChannelId),
    logEnabled: patch.logEnabled ?? current.logEnabled,
    logToggles: patch.logToggles ?? current.logToggles,
    antiRaidEnabled: patch.antiRaidEnabled ?? current.antiRaidEnabled,
    antiRaidJoinsLimit: patch.antiRaidJoinsLimit ?? current.antiRaidJoinsLimit,
    antiRaidJoinsWindow: patch.antiRaidJoinsWindow ?? current.antiRaidJoinsWindow,
    antiNukeEnabled: patch.antiNukeEnabled ?? current.antiNukeEnabled,
    ticketCategoryId: patch.ticketCategoryId !== undefined ? cleanString(patch.ticketCategoryId) : current.ticketCategoryId,
    supportRoleId: patch.supportRoleId !== undefined ? cleanString(patch.supportRoleId) : current.supportRoleId,
    accentColor: cleanColor(patch.accentColor ?? current.accentColor),
    updatedAt: current.updatedAt
  };

  const result = await query<GuildConfigRow>(
    `insert into public."GuildConfig" (
      "guildId", "welcomeChannelId", "welcomeMessage", "welcomeType", 
      "logChannelId", "logEnabled", "logToggles", 
      "antiRaidEnabled", "antiRaidJoinsLimit", "antiRaidJoinsWindow", 
      "antiNukeEnabled", "accentColor"
    ) values (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
    )
    on conflict ("guildId") do update set
      "welcomeChannelId" = excluded."welcomeChannelId",
      "welcomeMessage" = excluded."welcomeMessage",
      "welcomeType" = excluded."welcomeType",
      "logChannelId" = excluded."logChannelId",
      "logEnabled" = excluded."logEnabled",
      "logToggles" = excluded."logToggles",
      "antiRaidEnabled" = excluded."antiRaidEnabled",
      "antiRaidJoinsLimit" = excluded."antiRaidJoinsLimit",
      "antiRaidJoinsWindow" = excluded."antiRaidJoinsWindow",
      "antiNukeEnabled" = excluded."antiNukeEnabled",
      "accentColor" = excluded."accentColor"
    returning *`,
    [
      guildId,
      next.welcomeChannelId,
      next.welcomeMessage,
      next.welcomeType,
      next.logChannelId,
      next.logEnabled,
      next.logToggles,
      next.antiRaidEnabled,
      next.antiRaidJoinsLimit,
      next.antiRaidJoinsWindow,
      next.antiNukeEnabled,
      next.accentColor
    ]
  );

  if (patch.ticketCategoryId !== undefined || patch.supportRoleId !== undefined) {
    await query(
      `insert into public."TicketConfig" ("guildId", "categoryId", "supportRoleId")
       values ($1, $2, $3)
       on conflict ("guildId") do update set
         "categoryId" = excluded."categoryId",
         "supportRoleId" = excluded."supportRoleId"`,
      [guildId, next.ticketCategoryId, next.supportRoleId]
    );
  }

  const ticketResult = await query<{ categoryId: string | null; supportRoleId: string | null }>(
    'select "categoryId", "supportRoleId" from public."TicketConfig" where "guildId" = $1',
    [guildId]
  );

  return toConfig(result.rows[0], guildId, ticketResult.rows[0]);
}
