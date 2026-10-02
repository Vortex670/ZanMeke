import { z } from "zod";

// ============================================================================
// Filtri iz naslovne vrstice — ena shema na vrsto polja
// ============================================================================
//
// 46 od 47 strani je `searchParams` razčlenjevalo na roko: 22-krat isti izraz
// `(qParam ?? "").trim().slice(0, 64)`, drugod `includes()` nad seznamom
// dovoljenih vrednosti. Vrednost iz naslova je vhod od zunaj kot vsak drug,
// zato gre skozi shemo — in ker so sheme tu, se meja spremeni na enem mestu.
//
// Vse sheme uporabljajo `.catch()`: filter iz naslova, ki je nesmiseln, ne sme
// podreti strani, ampak se tiho vrne na privzeto. Gost, ki v naslov natipka
// `?page=abc`, naj vidi prvo stran, ne napake.
// ----------------------------------------------------------------------------

/** Najdaljša iskalna poizvedba; daljše režemo, ne zavrnemo. */
export const SEARCH_MAX = 64;

/**
 * Iskalni niz (`?q=`). Obreže presledke in skrajša na `SEARCH_MAX` — enako,
 * kot je počel ročni izraz, da se vedenje ne spremeni.
 */
export const searchQuerySchema = z
  .string()
  .trim()
  .transform((v) => v.slice(0, SEARCH_MAX))
  .catch("");

/**
 * Stran za straničenje (`?page=`). Zgornja meja je nova: ročna različica je
 * sprejela poljubno veliko število in ga dala Prismi kot `skip`, kar je pri
 * `?page=99999999999` pomenilo preskok v bilijonih vrstic.
 */
export const PAGE_MAX = 10_000;

export const pageParamSchema = z
  .union([z.string(), z.number()])
  .transform((v) => Math.floor(Number(v)))
  .refine((n) => Number.isFinite(n) && n >= 1 && n <= PAGE_MAX)
  .catch(1);

/**
 * Filter z omejenim naborom vrednosti (`?status=`, `?sort=`, `?kat=`).
 * Neznana ali manjkajoča vrednost pomeni »brez filtra« (privzeto `null`), ne
 * napake — naslov, ki ga je kdo natipkal narobe, ne sme podreti strani.
 *
 * Sprejme navadno polje vrednosti (ne tuple), ker so seznami v ZM zapisani kot
 * `const VALID_STATUSES: ReviewCardStatus[] = [...]`.
 *
 * ```ts
 * const status = enumFilterSchema(VALID_STATUSES).parse(raw); // T | null
 * const vrsta = enumFilterSchema(actionValues, "").parse(raw); // T | ""
 * ```
 */
export function enumFilterSchema<T extends string, F extends T | null | "" = null>(
  values: readonly T[],
  fallback: F = null as F,
) {
  return z
    .string()
    .refine((v): v is T => (values as readonly string[]).includes(v))
    .catch(fallback as never) as unknown as z.ZodType<T | F, unknown>;
}

/**
 * Krajši filter prostega besedila (npr. cilj v dnevniku) — ista logika kot
 * `searchQuerySchema`, samo tesnejša meja.
 */
export const shortFilterSchema = z
  .string()
  .trim()
  .transform((v) => v.slice(0, 40))
  .catch("");
