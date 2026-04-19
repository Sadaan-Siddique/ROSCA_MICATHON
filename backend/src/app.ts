import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { router } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { env } from "./config/env.js";

export const app = express();

/** Hackathon demo: allow any browser origin so Vite (5173, 5174, …) never breaks CORS. */
app.use(
  cors({
    origin: "*",
    credentials: false,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(helmet());
app.use(
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false
  })
);
app.use(express.json({ limit: "100kb" }));
app.use("/api", router);
app.use(errorHandler);
