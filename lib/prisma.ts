import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/src/generated/prisma/client";

// ============================================================================
// lib/prisma.ts — en sam odjemalec baze
// ----------------------------------------------------------------------------
// `server-only`: če to datoteko uvozi komponenta v brskalniku, prevajanje
// pade. To je namerno — odjemalec baze v brskalniku pomeni, da bi povezovalni
// niz z geslom pristal v JavaScriptu, ki ga vidi vsak.
//
// V razvoju Next modul naloži ob vsaki spremembi; brez varovala v
// `globalThis` bi vsaka ponovna naložitev odprla nov bazen povezav in
// Supabase bi po nekaj urah dela zavrnil povezavo.
// ============================================================================

const g = globalThis as typeof globalThis & { __prisma?: PrismaClient };

function ustvari(): PrismaClient {
  const niz = process.env.DATABASE_URL;
  if (!niz) {
    throw new Error(
      "DATABASE_URL ni nastavljen. V .env.local zamenjaj [GESLO] z geslom baze.",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: niz }) });
}

export const prisma = g.__prisma ?? ustvari();

if (process.env.NODE_ENV !== "production") g.__prisma = prisma;
