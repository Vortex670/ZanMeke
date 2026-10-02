// ============================================================================
// lib/validation/slug.ts — naslov strani v pot
// ----------------------------------------------------------------------------
// Ista funkcija kot na gostilnica-plus.si (tam v `lib/menu/validation`). Tu
// stoji sama, ker zanmeke.com jedilnika nima.
//
// Šumniki gredo v osnovne črke in ne v odstranjene znake: iz »Politika
// zasebnosti« nastane `politika-zasebnosti`, iz »Piškotki« pa `piskotki` in
// ne `pikotki`. Pot z izgubljeno črko je tiha napaka, ki jo opaziš šele, ko
// je povezava že nekje objavljena.
// ============================================================================

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/č/gi, "c")
    .replace(/š/gi, "s")
    .replace(/ž/gi, "z")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
