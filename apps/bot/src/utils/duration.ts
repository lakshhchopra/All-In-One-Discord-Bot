/**
 * Shared duration parsing utility.
 * Supports: 10s (seconds), 5m (minutes), 2h (hours), 1d (days)
 */

export interface ParsedDuration {
  ms: number;       // total milliseconds
  seconds: number;  // total seconds
  label: string;    // human-readable, e.g. "5 minutes"
}

/**
 * Parse a duration string like "10s", "5m", "2h", "1d" into ms/seconds/label.
 * Returns null if the format is unrecognised.
 */
export function parseDuration(str: string): ParsedDuration | null {
  const match = str.trim().match(/^(\d+)([smhd])$/i);
  if (!match) return null;

  const val = parseInt(match[1], 10);
  if (val <= 0) return null;

  const unit = match[2].toLowerCase();
  const unitNames: Record<string, string> = { s: "second", m: "minute", h: "hour", d: "day" };
  const multipliers: Record<string, number> = {
    s: 1_000,
    m: 60_000,
    h: 3_600_000,
    d: 86_400_000,
  };

  const ms = val * multipliers[unit];
  const label = `${val} ${unitNames[unit]}${val !== 1 ? "s" : ""}`;

  return { ms, seconds: ms / 1000, label };
}

/** Returns a user-friendly error string for invalid duration input. */
export const DURATION_FORMAT_ERROR =
  "Invalid duration format. Use e.g. `10s` (seconds), `5m` (minutes), `2h` (hours), `1d` (days).";
