// ============================================================================
// lib/media/limits.ts — omejitve nalaganja slik
// ----------------------------------------------------------------------------
// Ločena datoteka, ker `lib/media/actions.ts` nosi `"use server"`, taka
// datoteka pa sme izvažati SAMO asinhrone funkcije. Ko je bila omejitev
// izvožena od tam, je Next zavrnil cel modul — in ker `ImageField` ta modul
// potegne v vsak obrazec z sliko, ni bilo mogoče shraniti nobene jedi.
//
// Meja stoji tu, ker jo morata poznati oba konca: obrazec, da pove, kaj je
// preveliko, še preden datoteko pošlje, in strežnik, ki je edini, na katerega
// se je pri tem mogoče zanesti.
// ============================================================================

/** 12 MB — sodobni telefon naredi 3–6 MB, rezerva za zrcalnorefleksni. */
export const NAJVEC_MB = 12;

export const NAJVEC_BAJTOV = NAJVEC_MB * 1024 * 1024;

/** Kaj sprejmemo. Vse se tako ali tako pretvori v WebP. */
export const DOVOLJENE_VRSTE = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
] as const;
