import "server-only";

import {
  BLOKI_PO_STRANEH,
  privzetiVrstniRed,
  type BlokDef,
  type StranKljuc,
} from "@/lib/domov/bloki";
import { prisma } from "@/lib/prisma";

// ============================================================================
// lib/domov/queries.ts — branje odsekov domače strani
// ----------------------------------------------------------------------------
// Register (koda) je vedno vir resnice o tem, kateri odseki obstajajo. Baza
// doda le, kaj je urednik spremenil — zato odsek, ki ga v bazi ni, ni napaka,
// ampak preprosto še ni bil urejen.
// ============================================================================

// IMENA POLJ SO ENAKA kot na gostilnica-plus.si (`isVisible`, `sortOrder`,
// `data`), čeprav so stolpci v bazi slovenski. Razlog je praktičen: stran za
// urejanje in komponente so na obeh projektih ista koda in se prenašajo s
// kopiranjem datoteke. Preimenovanje v TypeScriptu bi pomenilo, da je treba
// vsak prenos popravljati — in prav tam nastanejo razlike.
export type BlokStanje = {
  def: BlokDef;
  isVisible: boolean;
  sortOrder: number;
  data: Record<string, string>;
  /** Kdaj je bil odsek nazadnje urejen; `null` = kaže privzeto besedilo. */
  updatedAt: Date | null;
};

function beriPodatke(raw: unknown): Record<string, string> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = v;
  }
  return out;
}

/** Privzeto stanje iz registra — kadar baze ni ali še ni bila urejena. */
function privzeto(stran: StranKljuc): BlokStanje[] {
  const red = privzetiVrstniRed(stran);
  return BLOKI_PO_STRANEH[stran].map((def) => ({
    def,
    isVisible: true,
    sortOrder: red.indexOf(def.kljuc),
    data: {},
    updatedAt: null,
  }));
}

export async function getBloki(stran: StranKljuc = "domov"): Promise<BlokStanje[]> {
  // Padec poizvedbe NE SME sprazniti domače strani. Brez tega bi vsaka
  // motnja v bazi (ali zastarel odjemalec po migraciji) pustila obiskovalca
  // pred golo glavo in nogo — videti bi bilo, kot da strani ni več.
  const vrstice = await prisma.vsebinaBlok
    .findMany({ where: { stran } })
    .catch((e: unknown) => {
      // NAPAKO ZAPIŠEMO, čeprav jo prestrežemo. Tiho vračanje privzetega je
      // videti natanko tako kot »odsek še ni bil urejen« — in ko se je to res
      // zgodilo (zastarel Prisma odjemalec po migraciji), je bilo videti, da
      // shranjevanje v adminu ne dela, pri tem pa ni bilo nikjer nobene sledi.
      console.error("[domov] odsekov ni bilo mogoče prebrati:", e);
      return null;
    });
  if (!vrstice) return privzeto(stran);

  const poKljucu = new Map(vrstice.map((v) => [v.kljuc, v]));

  const red = privzetiVrstniRed(stran);
  return BLOKI_PO_STRANEH[stran]
    .map((def) => {
      const zapis = poKljucu.get(def.kljuc);
      const data = beriPodatke(zapis?.podatki);
      return {
        def,
        isVisible: zapis?.viden ?? true,
        sortOrder: zapis?.zaporedje ?? red.indexOf(def.kljuc),
        data,
        // Urejen je tisti, ki ima vpisano vsaj eno besedilo. Sama sprememba
        // vrstnega reda ali vidnosti še ne pomeni, da je besedilo tvoje.
        updatedAt: zapis && Object.keys(data).length > 0 ? zapis.updatedAt : null,
      };
    })
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Za javno stran: samo vidni odseki, v pravem vrstnem redu. */
export async function getVidniBloki(stran: StranKljuc = "domov"): Promise<BlokStanje[]> {
  const vsi = await getBloki(stran).catch(() => privzeto(stran));
  return vsi.filter((b) => b.isVisible || b.def.obvezen);
}

/** En odsek po ključu — za stran za urejanje. */
export async function getBlok(
  stran: StranKljuc,
  kljuc: string,
): Promise<BlokStanje | null> {
  const vsi = await getBloki(stran);
  return vsi.find((b) => b.def.kljuc === kljuc) ?? null;
}
