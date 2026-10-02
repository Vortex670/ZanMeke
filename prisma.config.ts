import path from "node:path";

import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma 7 pred uvozom te datoteke ne naloži `.env` sam, zato dotenv ročno.
// Next.js konvencija: skrivnosti so v `.env.local`.
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  datasource: { url: env("DIRECT_URL") },
  migrations: { path: path.join("prisma", "migrations") },
});
