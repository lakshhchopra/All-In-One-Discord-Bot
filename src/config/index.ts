import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DISCORD_TOKEN: z.string(),
  DISCORD_CLIENT_ID: z.string(),
  DEFAULT_PREFIX: z.string().default("-"),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  PORT: z.coerce.number().default(3001),
  DASHBOARD_URL: z.string().default("http://localhost:3000"),
  JWT_SECRET: z.string().default("jwt_fallback_secret")
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
