import dotenv from "dotenv";
import { z } from "zod";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load .env from apps/bot/ when running as a workspace,
// or from project root when running from root with tsx watch.
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../.env") }); // apps/bot/.env
dotenv.config(); // fallback: root .env

const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  DISCORD_CLIENT_ID: z.string(),
  DEFAULT_PREFIX: z.string().default("-"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PORT: z.coerce.number().default(3001),
  SUPPORT_GUILD_ID: z.string().optional()
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
