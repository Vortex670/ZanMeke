import { z } from "zod";

import { DOVOLJENE_VRSTE, NAJVEC_BAJTOV, NAJVEC_MB } from "@/lib/media/limits";

// ============================================================================
// lib/media/validation.ts — kaj sme v shrambo
// ----------------------------------------------------------------------------
// Preverbe so bile v `actions.ts` kot zaporedje `if`-ov. Niso bile napačne,
// a pravilo se je bralo šele skozi kodo; tu je napisano kot pogodba.
//
// MAPA JE SLUG IN NE POLJUBEN NIZ. Vrednost pride iz obrazca in gre v ključ
// predmeta v shrambi; brez omejitve bi lahko kdor koli z dostopom do
// administracije zapisoval zunaj predvidene predpone. Akcija je to že
// reševala z odstranjevanjem znakov, kar je pravi učinek — shema pa pove
// NAMEN, in namen je, da je mapa ena beseda.
// ============================================================================

export const mapaShema = z
  .string()
  .trim()
  .toLowerCase()
  .transform((v) => v.replace(/[^a-z0-9-]/g, ""))
  .pipe(z.string().min(1).max(40))
  .catch("splosno");

export const slikaShema = z
  .instanceof(File, { message: "Datoteke ni." })
  .refine((f) => f.size > 0, "Datoteka je prazna.")
  .refine(
    (f) => (DOVOLJENE_VRSTE as readonly string[]).includes(f.type),
    "Dovoljene so slike JPEG, PNG, WebP ali AVIF.",
  )
  .refine((f) => f.size <= NAJVEC_BAJTOV, `Slika je prevelika — največ ${NAJVEC_MB} MB.`);

/** Naslov slike za brisanje — zapis v bazi je tako ali tako edini vir resnice. */
export const urlSlikeShema = z.string().trim().min(1).max(2048);
