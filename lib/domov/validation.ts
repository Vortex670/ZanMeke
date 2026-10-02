import { z } from "zod";

import { STRANI } from "@/lib/domov/bloki";

// ============================================================================
// lib/domov/validation.ts — vhod urednika odsekov
// ----------------------------------------------------------------------------
// Pravila so obstajala že prej, a raztresena po `actions.ts`: ena primerjava
// tu, en `slice()` tam. Delovala so — niso pa bila najdljiva. Shema je tu
// zato, da se pravilo prebere na enem mestu in da velja isti dogovor kot
// pri vseh drugih domenah.
//
// KLJUČ ODSEKA SE TU NE NAŠTEVA. Veljavni ključi so v registru blokov in se
// z njim spreminjajo; shema preveri le obliko, register pa obstoj. Seznam
// ključev na dveh mestih je seznam, ki se razide ob prvem novem odseku.
// ============================================================================

export const stranShema = z.enum(STRANI);

export const kljucShema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[a-z0-9-]+$/, "Ključ odseka je lahko le mala črka, števka ali vezaj.");

export const smerShema = z.enum(["gor", "dol"]);

/**
 * Besedila odseka — zemljevid polje → vrednost.
 *
 * Dolžina posameznega polja se NE preverja tu: vsako polje ima svojo mejo v
 * registru (`polje.najvec`) in akcija po njej reže. Tu stoji le skupna meja,
 * ki ustavi očitno zlorabo.
 */
export const blokBesediloShema = z.record(z.string().max(64), z.string().max(5000));

export const toggleBlokShema = z.object({ stran: stranShema, kljuc: kljucShema });
export const premakniBlokShema = toggleBlokShema.extend({ smer: smerShema });
export const saveBlokShema = toggleBlokShema.extend({ data: blokBesediloShema });
