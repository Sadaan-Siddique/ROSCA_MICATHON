import express from "express";
import cors from "cors";
import { router } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(cors());
app.use(express.json());
app.use("/api", router);
app.use(errorHandler);
