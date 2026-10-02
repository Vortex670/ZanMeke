import "server-only";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/racuni/queries.ts — branje računov
// ============================================================================

/**
 * Odprte listine — osnutki in poslane.
 *
 * Plačane in preklicane gredo v arhiv. Seznam, ki raste v nedogled, neha
 * biti seznam dela in postane zgodovina; delo je tisto, kar še ni rešeno.
 */
export async function getRacuni(stanje?: "OSNUTEK" | "POSLAN" | "PLACAN" | "PREKLICAN") {
  return prisma.racun.findMany({
    where: stanje ? { stanje } : { stanje: { in: ["OSNUTEK", "POSLAN"] } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

// ----------------------------------------------------------------------------
// Arhiv — mape, ne ploščat seznam
// ----------------------------------------------------------------------------
// Pot je LETO › MESEC › STRANKA, listine pa po datumu izdaje. Ploščat seznam
// stotih računov je brez uporabe: iskati je treba po očeh. V mapah je vsak
// korak ena odločitev in nikoli več kot dvanajst možnosti.
// ----------------------------------------------------------------------------

export type ArhivVrstica = { kljuc: string; napis: string; stevilo: number };

const ZAPRTA = ["PLACAN", "PREKLICAN"] as const;

export async function getArhivLeta(): Promise<ArhivVrstica[]> {
  const vrstice = await prisma.racun.findMany({
    where: { stanje: { in: [...ZAPRTA] } },
    select: { createdAt: true },
  });

  const po = new Map<number, number>();
  for (const v of vrstice) {
    const leto = v.createdAt.getFullYear();
    po.set(leto, (po.get(leto) ?? 0) + 1);
  }

  return [...po.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([leto, stevilo]) => ({
      kljuc: String(leto),
      napis: String(leto),
      stevilo,
    }));
}

const MESECI = [
  "januar",
  "februar",
  "marec",
  "april",
  "maj",
  "junij",
  "julij",
  "avgust",
  "september",
  "oktober",
  "november",
  "december",
];

export async function getArhivMesece(leto: number): Promise<ArhivVrstica[]> {
  const od = new Date(leto, 0, 1);
  const do_ = new Date(leto + 1, 0, 1);

  const vrstice = await prisma.racun.findMany({
    where: { stanje: { in: [...ZAPRTA] }, createdAt: { gte: od, lt: do_ } },
    select: { createdAt: true },
  });

  const po = new Map<number, number>();
  for (const v of vrstice) {
    const m = v.createdAt.getMonth();
    po.set(m, (po.get(m) ?? 0) + 1);
  }

  return [...po.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([m, stevilo]) => ({
      kljuc: String(m + 1),
      napis: MESECI[m] ?? String(m + 1),
      stevilo,
    }));
}

export async function getArhivRacune(leto: number, mesec: number) {
  const od = new Date(leto, mesec - 1, 1);
  const do_ = new Date(leto, mesec, 1);

  return prisma.racun.findMany({
    where: { stanje: { in: [...ZAPRTA] }, createdAt: { gte: od, lt: do_ } },
    orderBy: { createdAt: "desc" },
  });
}

/** Koliko listin je v arhivu — za značko na gumbu. */
export async function stejArhiv(): Promise<number> {
  return prisma.racun.count({ where: { stanje: { in: [...ZAPRTA] } } });
}

export async function getRacunCounts() {
  const [osnutek, poslan, placan, skupaj] = await Promise.all([
    prisma.racun.count({ where: { stanje: "OSNUTEK" } }),
    prisma.racun.count({ where: { stanje: "POSLAN" } }),
    prisma.racun.count({ where: { stanje: "PLACAN" } }),
    prisma.racun.count(),
  ]);
  return { osnutek, poslan, placan, skupaj };
}

/** Račun po javnem žetonu — za plačilno stran. Preklicanega ne vrne. */
export async function getRacunPoZetonu(zeton: string) {
  return prisma.racun.findFirst({
    where: { zeton, stanje: { not: "PREKLICAN" } },
  });
}

export async function getRacun(id: string) {
  return prisma.racun.findUnique({ where: { id } });
}

/**
 * Naslednja številka v letu, LOČENO po vrsti.
 *
 * Računi morajo imeti neprekinjeno zaporedje — to je zahteva računovodstva.
 * Predračuni vanj ne spadajo, zato imajo svoje s predpono `P`. Skupno
 * zaporedje bi v računih pustilo luknje povsod, kjer je bil vmes predračun.
 */
export async function naslednjaStevilka(
  vrsta: "RACUN" | "PREDRACUN" = "RACUN",
): Promise<string> {
  const leto = new Date().getFullYear();
  const predpona = vrsta === "PREDRACUN" ? `P-${leto}-` : `${leto}-`;

  const zadnji = await prisma.racun.findFirst({
    where: { stevilka: { startsWith: predpona } },
    orderBy: { stevilka: "desc" },
    select: { stevilka: true },
  });

  const zadnjaStevilka = zadnji ? Number(zadnji.stevilka.slice(predpona.length)) : 0;
  return `${predpona}${String(zadnjaStevilka + 1).padStart(3, "0")}`;
}
