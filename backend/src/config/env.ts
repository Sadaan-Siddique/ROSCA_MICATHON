import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  DATABASE_URL: z.string().min(1),
  FRONTEND_ORIGINS: z.string().default("http://localhost:5173,http://localhost:3000"),
  OTP_MOCK_CODE: z.string().length(4).default("1234"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().default(300)
});

export const env = envSchema.parse(process.env);
