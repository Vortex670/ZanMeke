import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/auth/omejitev.ts — koliko poskusov in kako pogosto
// ----------------------------------------------------------------------------
// Tabela `omejitve_poskusov` je v shemi stala od začetka, uporabljala je ni
// nobena koda. Prijava je bila s tem odprta za ugibanje gesla z neomejeno
// hitrostjo — in v adminu so računi strank, njihovi e-naslovi in plačilni
// podatki.
//
// OKNO JE FIKSNO in ne drseče. Drseče okno zahteva zapis vsakega poskusa
// posebej, fiksno pa en sam števec na okno — kar je tudi razlog, da ima
// tabela `@@unique([kljuc, zacetekOkna])`. Napaka fiksnega okna (dvojno
// število poskusov na prehodu med oknoma) je pri ugibanju gesla brez
// pomena; pri argon2id z 19 MiB je vsak poskus tako ali tako drag.
//
// DVE MERI, ker vsaka sama po sebi ne zadošča:
//
//   po NASLOVU IP  — ustavi običajen napad z enega mesta
//   po E-NASLOVU   — ustavi porazdeljen napad na isti račun
//
// Meja po e-naslovu je NAMENOMA ohlapnejša. Z eno samo administratorko na
// strani bi ostra meja pomenila, da me lahko kdorkoli zaklene iz lastnega
// admina s tem, da dvajsetkrat vpiše napačno geslo. Zaklepanje računa je
// obramba, ki jo je mogoče obrniti v napad.
//
// Ob USPEŠNI prijavi se števca pobrišeta: kdor se je prijavil, ni napadalec.
// ============================================================================

export type IzidOmejitve = { dovoljeno: true } | { dovoljeno: false; cezSekund: number };

/** Naslov obiskovalca za Vercelom; `null`, kadar ga ni mogoče dobiti. */
export async function naslovIp(): Promise<string | null> {
  const g = await headers();
  return g.get("x-forwarded-for")?.split(",")[0]?.trim() ?? g.get("x-real-ip") ?? null;
}

/**
 * Prišteje poskus in pove, ali je še dovoljen.
 *
 * Šteje se PRED preverjanjem gesla, torej tudi uspešni poskusi — sicer bi
 * napadalec z enim pravilnim geslom vmes sprostil števec.
 */
export async function steviPoskus(
  kljuc: string,
  najvec: number,
  oknoMinut: number,
): Promise<IzidOmejitve> {
  const oknoMs = oknoMinut * 60_000;
  const zdaj = Date.now();
  const zacetekOkna = new Date(Math.floor(zdaj / oknoMs) * oknoMs);
  const potece = new Date(zacetekOkna.getTime() + oknoMs);

  try {
    const zapis = await prisma.omejitevPoskusov.upsert({
      where: { kljuc_zacetekOkna: { kljuc, zacetekOkna } },
      create: { kljuc, zacetekOkna, potece, stevilo: 1 },
      update: { stevilo: { increment: 1 } },
      select: { stevilo: true },
    });

    if (zapis.stevilo <= najvec) return { dovoljeno: true };
    return {
      dovoljeno: false,
      cezSekund: Math.max(1, Math.ceil((potece.getTime() - zdaj) / 1000)),
    };
  } catch {
    // Baza ne odgovori. Prijavo PUSTIMO skozi: nedosegljiva tabela števcev ne
    // sme pomeniti, da se ni mogoče prijaviti. Geslo je še vedno treba vedeti.
    return { dovoljeno: true };
  }
}

/** Po uspešni prijavi — števci za ta naslov in e-pošto gredo stran. */
export async function pocistiPoskuse(kljuci: string[]): Promise<void> {
  try {
    await prisma.omejitevPoskusov.deleteMany({ where: { kljuc: { in: kljuci } } });
  } catch {
    // Brez posledic: zapisi tako ali tako potečejo sami.
  }
}

/** Potekla okna — pospravi se mimogrede, brez svojega opravila. */
export async function pocistiPoteklaOkna(): Promise<void> {
  try {
    await prisma.omejitevPoskusov.deleteMany({ where: { potece: { lt: new Date() } } });
  } catch {
    /* tiho */
  }
}

/** Minute v besedilu, ki ga razume človek: »čez 12 minut«. */
export function cezKoliko(sekund: number): string {
  if (sekund < 90) return "čez minuto";
  return `čez ${Math.ceil(sekund / 60)} minut`;
}
