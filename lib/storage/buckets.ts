// ============================================================================
// Razvrstitev ključev na javne in zasebne
// ----------------------------------------------------------------------------
// Brez odvisnosti in brez `server-only` — uvaža ga tudi `lib/media/url.ts`,
// ki teče na klientu.
//
// ZAKAJ OBSTAJA: R2 javni dostop je lastnost CELEGA vedra, ne posamezne
// datoteke. `visibility: "private"` pri nalaganju pove samo »ne vrni javnega
// URL-ja« — datoteke ne skrije. Dokler so originali, čiste različice in
// računi v istem vedru kot sličice, jih lahko prebere kdorkoli, ki ugane
// ključ (in ključ originala je ista koda kot ključ javne sličice).
// Zato gredo te predpone v ločeno, zaprto vedro `R2_BUCKET_PRIVATE`.
//
// Isti seznam velja za pisanje in branje, zato klicna mesta ostanejo
// nespremenjena — ponudnik sam izbere pravo vedro glede na ključ.
// ============================================================================

/**
 * Tri vedra na projekt — vsaka datoteka ima svoje mesto (Žan, 14. 9. 2026:
 * »da bo vse urejeno in logično in bo vse imelo svoje mesto«):
 *
 *   <projekt>-photos     javno: sličice, predogledi z vodnim žigom, oglasi
 *   <projekt>-private    zasebne slike: originali in čiste različice
 *   <projekt>-documents  listine: računi, predračuni, izvozi, paketi za prenos
 *
 * Isti razrez je na second-home.hr in bo na gostilnici.
 */

/** Zasebne SLIKE — brez vodnega žiga, nikoli javno. */
export const PRIVATE_KEY_PREFIXES = ["originals/", "displays-clean/"] as const;

/** LISTINE — imena in zneski strank; hranijo se ločeno od slik. */
export const DOCUMENT_KEY_PREFIXES = [
  "invoices/",
  "documents/",
  "exports/",
  "zip-cache/",
] as const;

/** Ali ključ sodi med listine. */
export function isDocumentKey(key: string): boolean {
  return DOCUMENT_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/** Ali ključ sodi med zasebne slike. */
export function isPrivatePhotoKey(key: string): boolean {
  return PRIVATE_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

/**
 * Ali je ključ nejaven (zasebna slika ALI listina). Uporablja ga izris, da
 * za take datoteke sploh ne sestavi javnega naslova.
 */
export function isPrivateKey(key: string): boolean {
  return isPrivatePhotoKey(key) || isDocumentKey(key);
}
