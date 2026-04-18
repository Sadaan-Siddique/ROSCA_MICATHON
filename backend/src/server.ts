import "dotenv/config";
import { app } from "./app.js";
import { env } from "./config/env.js";

function assertRequiredEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Create backend/.env and set DATABASE_URL.");
  }
}

try {
  assertRequiredEnv();

  app.listen(env.PORT, () => {
    console.log(`Backend running on http://localhost:${env.PORT}`);
  });
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown startup error";
  console.error(`[Startup Error] ${message}`);
  process.exit(1);
}
