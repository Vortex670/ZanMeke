// ============================================================================
// lib/privolitev.ts — privolitev v merjenje obiska
// ----------------------------------------------------------------------------
// Statistika te strani postavi piškotek z naključno oznako obiskovalca in
// shrani zgoščeno sled naslova IP. To NI nujno potreben piškotek: stran brez
// njega dela enako. Zato zanj po 157. členu ZEKom-2 (in po GDPR) potrebujemo
// privolitev, ki mora biti PROSTOVOLJNA — zavrnitev mora biti enako lahka kot
// privolitev.
//
// Zapis je v piškotku prve stranke in namenoma NI `httpOnly`: pas mora v
// brskalniku vedeti, ali se sploh pokaže, in to mora vedeti brez klica na
// strežnik. Vsebina ni občutljiva — v njem je »da« ali »ne«.
//
// Strežnik privolitev preveri ŠE ENKRAT (`zabeleziOgled`). Odjemalec lahko
// laže; zapis v bazo sme nastati samo, kadar privolitev res stoji.
// ============================================================================

export const PISKOTEK_PRIVOLITVE = "zm_privolitev";

/** Pol leta. Po tem se vprašanje postavi znova — privolitev ni za vedno. */
export const PRIVOLITEV_DNI = 182;

export type Privolitev = "da" | "ne";

/** Preberi odločitev iz niza piškotkov (brskalnik ali glava zahtevka). */
export function preberiPrivolitev(niz: string | undefined | null): Privolitev | null {
  if (!niz) return null;
  const najdeno = niz
    .split(";")
    .map((d) => d.trim())
    .find((d) => d.startsWith(`${PISKOTEK_PRIVOLITVE}=`));
  const v = najdeno?.slice(PISKOTEK_PRIVOLITVE.length + 1);
  return v === "da" || v === "ne" ? v : null;
}
