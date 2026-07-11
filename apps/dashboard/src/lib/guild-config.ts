import { query } from "@/lib/db";

export type GuildConfig = {
  guildId: string;
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  welcomeType: string;
  logChannelId: string | null;
  ticketCategoryId: string | null;
  supportRoleId: string | null;
  verifiedRoleId: string | null;
  autoRoleId: string | null;
  tempVoiceJoinChannelId: string | null;
  tempVoiceCategoryId: string | null;
  birthdayChannelId: string | null;
  levelingEnabled: boolean;
  levelUpChannelId: string | null;
  accentColor: number;
  updatedAt: string | null;
};

type GuildConfigRow = {
  guildId: string;
  welcomeChannelId: string | null;
  welcomeMessage: string | null;
  welcomeType: string | null;
  logChannelId: string | null;
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
    ticketCategoryId: null,
    supportRoleId: null,
    verifiedRoleId: null,
    autoRoleId: null,
    tempVoiceJoinChannelId: null,
    tempVoiceCategoryId: null,
    birthdayChannelId: null,
    levelingEnabled: false,
    levelUpChannelId: null,
    accentColor: 0x38dff8,
    updatedAt: null
  };
}

function toConfig(row: GuildConfigRow | undefined, guildId: string): GuildConfig {
  const base = fallback(guildId);
  if (!row) return base;

  return {
    guildId: row.guildId,
    welcomeChannelId: row.welcomeChannelId,
    welcomeMessage: row.welcomeMessage ?? base.welcomeMessage,
    welcomeType: row.welcomeType ?? base.welcomeType,
    logChannelId: row.logChannelId,
    ticketCategoryId: null,
    supportRoleId: null,
    verifiedRoleId: null,
    autoRoleId: null,
    tempVoiceJoinChannelId: null,
    tempVoiceCategoryId: null,
    birthdayChannelId: null,
    levelingEnabled: false,
    levelUpChannelId: null,
    accentColor: row.accentColor ?? base.accentColor,
    updatedAt: row.updatedAt
  };
}

function cleanString(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function cleanBoolean(value: unknown) {
  return value === true;
}

function cleanColor(value: unknown) {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0x38dff8;
  return Math.max(0, Math.min(0xffffff, Math.round(value)));
}

export async function getGuildConfig(guildId: string) {
  const result = await query<GuildConfigRow>('select * from public."GuildConfig" where "guildId" = $1', [guildId]);
  return toConfig(result.rows[0], guildId);
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
    accentColor: cleanColor(patch.accentColor ?? current.accentColor),
    updatedAt: current.updatedAt
  };

  const result = await query<GuildConfigRow>(
    `insert into public."GuildConfig" (
      "guildId", "welcomeChannelId", "welcomeMessage", "welcomeType", "logChannelId", "accentColor"
    ) values (
      $1, $2, $3, $4, $5, $6
    )
    on conflict ("guildId") do update set
      "welcomeChannelId" = excluded."welcomeChannelId",
      "welcomeMessage" = excluded."welcomeMessage",
      "welcomeType" = excluded."welcomeType",
      "logChannelId" = excluded."logChannelId",
      "accentColor" = excluded."accentColor"
    returning *`,
    [
      guildId,
      next.welcomeChannelId,
      next.welcomeMessage,
      next.welcomeType,
      next.logChannelId,
      next.accentColor
    ]
  );

  return toConfig(result.rows[0], guildId);
}
