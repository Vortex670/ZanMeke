import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { Prisma, PrismaClient } from "@/src/generated/prisma/client";

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
//
// PO MIGRACIJI SE ODJEMALEC ZAMENJA SAM. Varovalo v `globalThis` preživi
// ponovno naložitev modula — tudi takrat, ko se je med tem spremenila shema
// in je bil ustvarjen nov odjemalec. Posledica je bila vsakič ista in vsakič
// zavajajoča: `prisma.novaTabela` je bil `undefined`, stran je javila
// »Cannot read properties of undefined«, koda pa je bila pravilna. Zato se
// ob naložitvi primerja seznam modelov; ko se razlikuje, se stari odjemalec
// zapre in ustvari nov. Razvojni strežnik od tod naprej ne potrebuje
// ponovnega zagona po `prisma migrate`.
// ============================================================================

const g = globalThis as typeof globalThis & {
  __prisma?: PrismaClient;
  __prismaModeli?: string;
};

/**
 * Podpis sheme: imena modelov IN njihovih polj.
 *
 * Samo imena modelov niso dovolj. Ko migracija doda stolpec v obstoječo
 * tabelo, se seznam modelov ne spremeni, star odjemalec ostane — in ta
 * stolpca ne zna izbrati. Vrednost pride kot `undefined`, koda računa z njo
 * naprej in na računu piše »NaN €«. Nobena napaka se ne javi.
 *
 * `dmmf` je del ustvarjenega odjemalca in se prebere enkrat ob naložitvi
 * modula, ne ob vsaki poizvedbi.
 */
const PODPIS = Prisma.dmmf.datamodel.models
  .map((m) => `${m.name}:${m.fields.map((f) => f.name).join(".")}`)
  .sort()
  .join("|");

function ustvari(): PrismaClient {
  const niz = process.env.DATABASE_URL;
  if (!niz) {
    throw new Error(
      "DATABASE_URL ni nastavljen. V .env.local zamenjaj [GESLO] z geslom baze.",
    );
  }
  return new PrismaClient({ adapter: new PrismaPg({ connectionString: niz }) });
}

if (g.__prisma && g.__prismaModeli !== PODPIS) {
  // Zapiramo brez čakanja: stari odjemalec ne obdeluje nobene zahteve več,
  // nanj pa se ne sme čakati — ta modul se naloži med izrisom strani.
  void g.__prisma.$disconnect().catch(() => undefined);
  g.__prisma = undefined;
}

export const prisma = g.__prisma ?? ustvari();

if (process.env.NODE_ENV !== "production") {
  g.__prisma = prisma;
  g.__prismaModeli = PODPIS;
}
