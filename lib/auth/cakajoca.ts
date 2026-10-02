import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

// ============================================================================
// lib/auth/cakajoca.ts — med geslom in kodo
// ----------------------------------------------------------------------------
// Pri dvofaktorski prijavi je med pravilnim geslom in veljavno kodo vmesno
// stanje: vemo, KDO se prijavlja, a seje še ne smemo odpreti. To stanje mora
// nekje počakati, in ne sme biti seja — polovica prijave, ki bi se dala
// uporabiti kot cela, je slabša od odsotnosti 2FA.
//
// Nosi ga PODPISAN PIŠKOTEK in ne zapis v bazi: velja pet minut, vsebuje samo
// oznako uporabnika in čas, podpis pa prepreči, da bi si kdo vanj vpisal tuj
// račun. Zapis v bazi bi za pet minut veljavnosti pomenil tabelo, ki jo je
// treba pospravljati.
//
// Podpis gre čez `SESSION_SECRET` — spremenljivko, ki je bila doslej na
// Vercelu in je koda ni brala nikjer. Zdaj ima nalogo.
// ============================================================================

const PISKOTEK = "zm_cakajoca";
const VELJA_MS = 5 * 60_000;

function kljuc(): string {
  return process.env.SESSION_SECRET?.trim() || "zm-brez-skrivnosti";
}

function podpisi(telo: string): string {
  return createHmac("sha256", kljuc()).update(telo).digest("base64url");
}

export async function zacniCakajoco(uporabnikId: string): Promise<void> {
  const telo = Buffer.from(
    JSON.stringify({ id: uporabnikId, do: Date.now() + VELJA_MS }),
  ).toString("base64url");

  (await cookies()).set(PISKOTEK, `${telo}.${podpisi(telo)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VELJA_MS / 1000,
  });
}

/** Oznaka uporabnika sredi prijave — `null`, kadar je ni ali je potekla. */
export async function beriCakajoco(): Promise<string | null> {
  const vrednost = (await cookies()).get(PISKOTEK)?.value;
  if (!vrednost) return null;

  const [telo, podpis] = vrednost.split(".");
  if (!telo || !podpis) return null;

  // Primerjava podpisa mora biti časovno stalna, sicer se da podpis uganiti
  // bajt za bajtom.
  const pricakovan = Buffer.from(podpisi(telo));
  const dobljen = Buffer.from(podpis);
  if (pricakovan.length !== dobljen.length) return null;
  if (!timingSafeEqual(pricakovan, dobljen)) return null;

  try {
    const { id, do: velja } = JSON.parse(
      Buffer.from(telo, "base64url").toString("utf8"),
    ) as { id: string; do: number };
    if (!id || typeof velja !== "number" || Date.now() > velja) return null;
    return id;
  } catch {
    return null;
  }
}

export async function koncajCakajoco(): Promise<void> {
  (await cookies()).delete(PISKOTEK);
}
