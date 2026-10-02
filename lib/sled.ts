import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/sled.ts — kdo je kaj naredil
// ----------------------------------------------------------------------------
// Tabela `sled` je v shemi stala od začetka in vanjo ni pisalo nič. Revizijska
// sled, ki je prazna, je enaka kot je ni — in vprašanje »kdo je izbrisal ta
// račun« takrat nima odgovora.
//
// Piše se SAMO tisto, kar je nepovratno ali varnostno pomembno: prijava,
// zamenjava gesla, vklop in izklop 2FA, odjava naprav, izbris. Dnevnik, ki
// beleži vse, se ne bere.
//
// ZAPIS NIKOLI NE VRŽE. Neuspel zapis v sled ne sme preprečiti dejanja, ki ga
// je uporabnik ravno opravil.
// ============================================================================

export type Dejanje =
  | "PRIJAVA_USPEH"
  | "PRIJAVA_NEUSPEH"
  | "ODJAVA"
  | "GESLO_SPREMENJENO"
  | "GESLO_PONASTAVLJENO"
  | "2FA_VKLOPLJENA"
  | "2FA_IZKLOPLJENA"
  | "2FA_REZERVNE_KODE"
  | "SEJA_ODJAVLJENA"
  | "RACUN_IZBRISAN";

export async function zapisiSled(vnos: {
  dejanje: Dejanje;
  uporabnikId?: string | null;
  tarca?: string | null;
  oznaka?: string | null;
  podatki?: Record<string, unknown>;
}): Promise<void> {
  try {
    const g = await headers();
    await prisma.sled.create({
      data: {
        dejanje: vnos.dejanje,
        uporabnikId: vnos.uporabnikId ?? null,
        tarca: vnos.tarca ?? null,
        oznaka: vnos.oznaka ?? null,
        ip: g.get("x-forwarded-for")?.split(",")[0]?.trim() ?? g.get("x-real-ip") ?? null,
        naprava: g.get("user-agent")?.slice(0, 200) ?? null,
        ...(vnos.podatki ? { podatki: vnos.podatki as object } : {}),
      },
    });
  } catch (e) {
    console.error("[sled] zapisa ni bilo mogoče narediti:", e);
  }
}

/** Berljiv opis naprave iz zapisa brskalnika — »Chrome na macOS«. */
export function opisNaprave(ua: string | null | undefined): string {
  const h = ua ?? "";
  const brskalnik = /Edg\//.test(h)
    ? "Edge"
    : /OPR\//.test(h)
      ? "Opera"
      : /Chrome\//.test(h)
        ? "Chrome"
        : /Firefox\//.test(h)
          ? "Firefox"
          : /Safari\//.test(h)
            ? "Safari"
            : "brskalnik";
  const sistem = /Windows/.test(h)
    ? "Windows"
    : /Mac OS X|Macintosh/.test(h)
      ? "macOS"
      : /Android/.test(h)
        ? "Android"
        : /iPhone|iPad/.test(h)
          ? "iOS"
          : /Linux/.test(h)
            ? "Linux"
            : "naprava";
  return `${brskalnik} na ${sistem}`;
}
