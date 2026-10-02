import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { cookies, headers } from "next/headers";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/auth/seja.ts — prijava, ki se jo da preklicati
// ----------------------------------------------------------------------------
// Seja živi v bazi, v piškotku je samo žeton. Razlog: podpisan piškotek se ne
// da preklicati — če ostane naprava prijavljena na tujem računalniku, je edina
// rešitev zamenjava skrivnosti in odjava vseh. Z zapisom v bazi se izbriše
// ena vrstica.
//
// V bazi je SHA-256 žetona in ne žeton: kdor dobi izvoz baze, se z njim ne
// more prijaviti.
//
// Piškotek je `httpOnly` (JavaScript ga ne vidi), `sameSite=lax` (ne gre z
// zahtevami s tujih strani) in `secure` v produkciji.
// ============================================================================

/**
 * Ime sejnega piškotka. Izvoženo, ker ga poleg prijave bere tudi analitika —
 * da lastnih obiskov ne šteje med tuje.
 */
export const IME_PISKOTKA = process.env.SESSION_COOKIE_NAME ?? "zm_seja";
const TRAJANJE_DNI = Number(process.env.SESSION_TTL_DAYS ?? 30);

const hash = (zeton: string) => createHash("sha256").update(zeton).digest("hex");

export type PrijavljenUporabnik = {
  id: string;
  email: string;
  ime: string;
};

/**
 * Ustvari sejo in postavi piškotek. Vrne nič — klicatelj preusmeri sam.
 *
 * `zapomni` odloča o piškotku, ne o seji: zapis v bazi ima rok tako ali tako.
 * Brez kljukice piškotek nima roka in ga brskalnik zavrže ob zaprtju — kar je
 * edino pravilno vedenje na tujem računalniku.
 */
export async function zacniSejo(uporabnikId: string, zapomni = true): Promise<void> {
  const zeton = randomBytes(32).toString("base64url");
  const potece = new Date(Date.now() + TRAJANJE_DNI * 24 * 3_600_000);

  const glave = await headers();
  await prisma.seja.create({
    data: {
      uporabnikId,
      zetonHash: hash(zeton),
      potece,
      naprava: glave.get("user-agent")?.slice(0, 200) ?? null,
      ip: glave.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    },
  });

  const piskotki = await cookies();
  piskotki.set(IME_PISKOTKA, zeton, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    ...(zapomni ? { expires: potece } : {}),
  });
}

/** Kdo je prijavljen — ali `null`. Ne preusmerja; to je stvar straže. */
export async function trenutniUporabnik(): Promise<PrijavljenUporabnik | null> {
  const zeton = (await cookies()).get(IME_PISKOTKA)?.value;
  if (!zeton) return null;

  const seja = await prisma.seja.findUnique({
    where: { zetonHash: hash(zeton) },
    select: {
      potece: true,
      uporabnik: { select: { id: true, email: true, ime: true } },
    },
  });

  if (!seja) return null;
  if (seja.potece < new Date()) return null;
  return seja.uporabnik;
}

/** Odjava — zapis iz baze in piškotek stran. */
export async function koncajSejo(): Promise<void> {
  const piskotki = await cookies();
  const zeton = piskotki.get(IME_PISKOTKA)?.value;

  if (zeton) {
    await prisma.seja
      .deleteMany({ where: { zetonHash: hash(zeton) } })
      .catch(() => undefined);
  }
  piskotki.delete(IME_PISKOTKA);
}

/** Počisti potekle seje — kliče se ob prijavi, da tabela ne raste v nedogled. */
export async function pocistiPotekle(): Promise<void> {
  await prisma.seja
    .deleteMany({ where: { potece: { lt: new Date() } } })
    .catch(() => undefined);
}
