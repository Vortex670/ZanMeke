"use server";

import { revalidatePath } from "next/cache";
import {
  premakniBlokShema,
  saveBlokShema,
  toggleBlokShema,
} from "@/lib/domov/validation";

import { zahtevajPrijavo } from "@/lib/auth/straza";
import {
  najdiBlok,
  privzetiVrstniRed,
  STRAN_POT,
  type StranKljuc,
} from "@/lib/domov/bloki";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/lib/actions/helpers";

// ============================================================================
// lib/domov/actions.ts — urejanje domače strani
// ----------------------------------------------------------------------------
// Vrstni red se shrani za VSE odseke hkrati, ne le za premaknjenega:
// zaporedje je ena stvar in bi se ob delnih zapisih razšlo.
//
// Vsako dejanje osveži tudi JAVNO stran, ne le admina. Brez tega urednik
// shrani besedilo, odpre stran in vidi staro — in misli, da shranjevanje ne
// dela.
// ============================================================================

function osvezi(stran: StranKljuc) {
  revalidatePath(`/admin/vsebina/${stran}`);
  revalidatePath(STRAN_POT[stran]);
}

/** Zapiše zapis odseka, če ga še ni. */
async function zagotovi(stran: StranKljuc, kljuc: string) {
  return prisma.vsebinaBlok.upsert({
    where: { stran_kljuc: { stran, kljuc } },
    create: {
      stran,
      kljuc,
      zaporedje: privzetiVrstniRed(stran).indexOf(kljuc),
      podatki: {},
    },
    update: {},
  });
}

export async function toggleBlokAction(
  stran: StranKljuc,
  kljuc: string,
): Promise<ActionResult> {
  await zahtevajPrijavo();

  const vhod = toggleBlokShema.safeParse({ stran, kljuc });
  if (!vhod.success) return { ok: false, message: "Tega odseka ni." };

  const def = najdiBlok(stran, kljuc);
  if (!def) return { ok: false, message: "Tega odseka ni." };
  if (def.obvezen) {
    return {
      ok: false,
      message: `»${def.ime}« je nosilni odsek in ga ni mogoče skriti.`,
    };
  }

  const zapis = await zagotovi(stran, kljuc);
  await prisma.vsebinaBlok.update({
    where: { stran_kljuc: { stran, kljuc } },
    data: { viden: !zapis.viden },
  });

  osvezi(stran);
  return { ok: true, message: zapis.viden ? "Odsek je skrit." : "Odsek je viden." };
}

export async function premakniBlokAction(
  stran: StranKljuc,
  kljuc: string,
  smer: "gor" | "dol",
): Promise<ActionResult> {
  await zahtevajPrijavo();

  const vhod = premakniBlokShema.safeParse({ stran, kljuc, smer });
  if (!vhod.success) return { ok: false, message: "Tega odseka ni." };

  const vrstice = await prisma.vsebinaBlok.findMany({ where: { stran } });
  const poKljucu = new Map(vrstice.map((v) => [v.kljuc, v]));

  // Trenutno zaporedje: kar je v bazi, sicer privzeto iz registra.
  const red = privzetiVrstniRed(stran);
  const zaporedje = [...red].sort((a, b) => {
    const av = poKljucu.get(a)?.zaporedje ?? red.indexOf(a);
    const bv = poKljucu.get(b)?.zaporedje ?? red.indexOf(b);
    return av - bv;
  });

  const i = zaporedje.indexOf(kljuc);
  const j = smer === "gor" ? i - 1 : i + 1;
  if (i < 0 || j < 0 || j >= zaporedje.length) {
    return { ok: false, message: "Odsek je že na robu." };
  }

  [zaporedje[i], zaporedje[j]] = [zaporedje[j]!, zaporedje[i]!];

  // Zaporedje je ena stvar — zapišemo ga v celoti.
  await prisma.$transaction(
    zaporedje.map((k, index) =>
      prisma.vsebinaBlok.upsert({
        where: { stran_kljuc: { stran, kljuc: k } },
        create: { stran, kljuc: k, zaporedje: index, podatki: {} },
        update: { zaporedje: index },
      }),
    ),
  );

  osvezi(stran);
  return { ok: true, message: "Vrstni red je shranjen." };
}

export async function saveBlokBesediloAction(
  stran: StranKljuc,
  kljuc: string,
  data: Record<string, string>,
): Promise<ActionResult> {
  await zahtevajPrijavo();

  // Shema pokrije obliko, register pa obstoj: ključi odsekov se s časom
  // spreminjajo in seznam na dveh mestih se razide ob prvem novem odseku.
  const vhod = saveBlokShema.safeParse({ stran, kljuc, data });
  if (!vhod.success) return { ok: false, message: "Vsebine ni bilo mogoče shraniti." };
  data = vhod.data.data;

  const def = najdiBlok(stran, kljuc);
  if (!def) return { ok: false, message: "Tega odseka ni." };

  // Shranimo samo polja, ki jih odsek res pozna, in v mejah, ki jih napove.
  // Prazno polje se ne shrani: takrat se vrne privzeto besedilo iz kode, kar
  // je edini način, da se urednik vrne na začetno stanje.
  const ocisceno: Record<string, string> = {};
  for (const polje of def.polja) {
    const v = data[polje.kljuc];
    if (typeof v !== "string") continue;
    const obrezano = v.trim().slice(0, polje.najvec);
    if (obrezano) ocisceno[polje.kljuc] = obrezano;
  }

  await prisma.vsebinaBlok.upsert({
    where: { stran_kljuc: { stran, kljuc } },
    create: {
      stran,
      kljuc,
      zaporedje: privzetiVrstniRed(stran).indexOf(kljuc),
      podatki: ocisceno,
    },
    update: { podatki: ocisceno },
  });

  osvezi(stran);
  return { ok: true, message: "Besedilo je shranjeno." };
}
