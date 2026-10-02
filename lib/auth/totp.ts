import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

import * as OTPAuth from "otpauth";

import { odsifriraj, zasifriraj } from "@/lib/auth/sifriranje";
import { STRAN } from "@/lib/podatki";
import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/auth/totp.ts — dvofaktorska prijava
// ----------------------------------------------------------------------------
// TOTP po RFC 6238 s knjižnico `otpauth`. SHA-1, šest števk, trideset sekund:
// to je kombinacija, ki jo privzeto pričakuje vsak generator (Google
// Authenticator, 1Password, Aegis). Odstopanje bi pomenilo, da kode ne
// delujejo, čeprav je vse pravilno — in tega ob prijavi nihče ne razvozla.
//
// ODSTOPANJE URE je ±1 korak, torej prejšnja, trenutna in naslednja koda. Ura
// na telefonu zna zaostati za nekaj sekund; brez tega bi se prijava občasno
// ponesrečila brez razloga. Širše okno pa po nepotrebnem podaljša čas, v
// katerem je prestrežena koda še uporabna.
//
// REZERVNE KODE so edina pot nazaj ob izgubljenem telefonu. Hranijo se kot
// SHA-256 odtis — kdor dobi izvoz baze, iz njega ne dobi nobene kode. Pokažejo
// se natanko enkrat, ob izdaji; druge priložnosti ni, ker je ni mogoče biti.
// ============================================================================

const IZDAJATELJ = STRAN.ime;
const ALGORITEM = "SHA1" as const;
const STEVK = 6;
const PERIODA_S = 30;
const ODSTOPANJE = 1;
const BAJTOV_SKRIVNOSTI = 20; // RFC 4226 priporoča najmanj toliko za SHA-1

export const REZERVNIH_KOD = 10;
const BAJTOV_KODE = 8; // 16 šestnajstiških znakov = 64 bitov entropije

// ----------------------------------------------------------------------------
// Skrivnost in koda
// ----------------------------------------------------------------------------

export function novaSkrivnost(): string {
  return new OTPAuth.Secret({ size: BAJTOV_SKRIVNOSTI }).base32;
}

/** `otpauth://` naslov za kodo QR in za ročni vnos. */
export function totpNaslov(skrivnost: string, oznaka: string): string {
  return new OTPAuth.TOTP({
    issuer: IZDAJATELJ,
    label: oznaka,
    algorithm: ALGORITEM,
    digits: STEVK,
    period: PERIODA_S,
    secret: OTPAuth.Secret.fromBase32(skrivnost),
  }).toString();
}

export function preveriKodo(skrivnost: string, koda: string): boolean {
  const ocisceno = koda.replace(/\D/g, "");
  if (ocisceno.length !== STEVK) return false;

  const totp = new OTPAuth.TOTP({
    issuer: IZDAJATELJ,
    algorithm: ALGORITEM,
    digits: STEVK,
    period: PERIODA_S,
    secret: OTPAuth.Secret.fromBase32(skrivnost),
  });

  return totp.validate({ token: ocisceno, window: ODSTOPANJE }) !== null;
}

// ----------------------------------------------------------------------------
// Skrivnost v bazi
// ----------------------------------------------------------------------------

export async function shraniSkrivnost(uporabnikId: string, skrivnost: string) {
  await prisma.uporabnik.update({
    where: { id: uporabnikId },
    data: { totpSkrivnost: zasifriraj(skrivnost), totpPotrjenAt: null },
  });
}

export async function beriSkrivnost(uporabnikId: string): Promise<string | null> {
  const u = await prisma.uporabnik.findUnique({
    where: { id: uporabnikId },
    select: { totpSkrivnost: true },
  });
  return u?.totpSkrivnost ? odsifriraj(u.totpSkrivnost) : null;
}

export async function jeVklopljen(uporabnikId: string): Promise<boolean> {
  const u = await prisma.uporabnik.findUnique({
    where: { id: uporabnikId },
    select: { totpPotrjenAt: true },
  });
  return Boolean(u?.totpPotrjenAt);
}

export async function izklopi(uporabnikId: string): Promise<void> {
  await prisma.$transaction([
    prisma.totpRezervnaKoda.deleteMany({ where: { uporabnikId } }),
    prisma.uporabnik.update({
      where: { id: uporabnikId },
      data: { totpSkrivnost: null, totpPotrjenAt: null },
    }),
  ]);
}

// ----------------------------------------------------------------------------
// Rezervne kode
// ----------------------------------------------------------------------------

const odtis = (koda: string) =>
  createHash("sha256").update(koda.replace(/[\s-]/g, "").toUpperCase()).digest("hex");

/** Izda nov komplet in zavrže star. Vrne kode v čisti obliki — edinkrat. */
export async function izdajRezervneKode(uporabnikId: string): Promise<string[]> {
  const kode = Array.from({ length: REZERVNIH_KOD }, () =>
    randomBytes(BAJTOV_KODE)
      .toString("hex")
      .toUpperCase()
      .replace(/(.{4})(?=.)/g, "$1-"),
  );

  await prisma.$transaction([
    prisma.totpRezervnaKoda.deleteMany({ where: { uporabnikId } }),
    prisma.totpRezervnaKoda.createMany({
      data: kode.map((k) => ({ uporabnikId, odtis: odtis(k) })),
    }),
  ]);

  return kode;
}

/** Porabi kodo, če obstaja in še ni bila uporabljena. */
export async function porabiRezervnoKodo(
  uporabnikId: string,
  koda: string,
): Promise<boolean> {
  const iskani = odtis(koda);

  // Primerjamo v kodi in ne v poizvedbi: primerjava odtisov je tako časovno
  // stalna. Kod je deset, zato je pregled cenejši od iskanja po bazi.
  const vsi = await prisma.totpRezervnaKoda.findMany({
    where: { uporabnikId, uporabljena: null },
    select: { id: true, odtis: true },
  });

  const najden = vsi.find((v) => {
    const a = Buffer.from(v.odtis, "hex");
    const b = Buffer.from(iskani, "hex");
    return a.length === b.length && timingSafeEqual(a, b);
  });

  if (!najden) return false;

  await prisma.totpRezervnaKoda.update({
    where: { id: najden.id },
    data: { uporabljena: new Date() },
  });
  return true;
}

export async function stejPreostaleKode(uporabnikId: string): Promise<number> {
  return prisma.totpRezervnaKoda.count({ where: { uporabnikId, uporabljena: null } });
}
