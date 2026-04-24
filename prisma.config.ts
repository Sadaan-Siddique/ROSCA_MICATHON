// When you run `npx prisma studio` from the repo root, Prisma loads this file first.
// Re-export so `prisma/config` resolves from `backend/node_modules`.
export { default } from "./backend/prisma.config.js";
