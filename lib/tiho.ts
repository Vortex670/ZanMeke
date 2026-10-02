// ============================================================================
// lib/tiho.ts — padec, ki ga hočemo preživeti, a ne prezreti
// ----------------------------------------------------------------------------
// `catch(() => [])` je bil po strani razsejan osemnajstkrat. Vedenje je bilo
// pravilno — javna stran se zaradi ene poizvedbe ne sme sesuti — posledica pa
// ne: gost je ob padcu baze prebral »Jedilnik pripravljamo«, čeprav je v bazi
// dvesto jedi, in nikjer ni ostalo sledi, da se je karkoli zgodilo.
//
// Ta ovoj naredi dvoje:
//   1. napako ZAPIŠE, z oznako, po kateri se v dnevniku vidi, kaj je padlo;
//   2. je GREPAJU VIDEN — `grep -rn "tiho(" .` našteje vsa mesta, kjer stran
//      nadaljuje s praznim, namesto da bi povedala, da ne more;
//
// Na gostilnici gre napaka tudi v zbiralnik v bazi, ki se ob prvi pojavitvi
// oglasi v administraciji. Tu te tabele (še) ni — dokler je strani pet,
// zadošča dnevnik strežnika.
//
// Kjer napaka NE sme biti požrta — objavljena novica, ki bi sicer vrnila 404
// in se ta 404 predpomnil za pet minut — se ovoj ne uporabi: tam naj prevzame
// meja napake (`error.tsx`).
// ============================================================================

/**
 * ```ts
 * const jedi = await getPublicMenu().catch(tiho("ponudba: jedilnik", []));
 * ```
 */
export function tiho<T>(oznaka: string, nadomestek: T): (e: unknown) => T {
  return (e: unknown) => {
    console.error(`[tiho] ${oznaka}:`, e);
    // Na gostilnici gre napaka tudi v zbiralnik v bazi, ki ob prvi
    // pojavitvi zazvoni v administraciji. Tu te tabele (še) ni: dokler je
    // strani pet in urednik eden, je dnevnik na Vercelu dovolj. Ko bo
    // zbiralnik, pride klic sem in nikamor drugam.
    return nadomestek;
  };
}
