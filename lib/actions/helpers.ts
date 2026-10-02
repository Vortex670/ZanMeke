// ============================================================================
// lib/actions/helpers.ts — izid strežniške akcije
// ----------------------------------------------------------------------------
// Vsaka akcija vrne isto obliko. Obrazec zato ne ugiba: ob `ok: false` pokaže
// sporočilo in napake pri poljih, ob `ok: true` pa toast in počisti polja.
//
// Napaka, ki je uporabnik ne more odpraviti, ne sme nikoli pricurljati na
// zaslon kot »Error: ECONNREFUSED«. `runAction` jo ujame, zapiše v dnevnik
// strežnika in človeku pove, kaj naj naredi — zato je v izhodu telefonska
// številka. Obrazec, ki samo reče »napaka«, je slabši od obrazca, ki ga ni.
// ============================================================================

import { STRAN } from "@/lib/podatki";

export type NapakePolj = Record<string, string[]>;

export type ActionOk<T = undefined> = { ok: true; message?: string; data?: T };
export type ActionFail = { ok: false; message: string; fieldErrors?: NapakePolj };
export type ActionResult<T = undefined> = ActionOk<T> | ActionFail;

export function uspeh<T = undefined>(message?: string, data?: T): ActionOk<T> {
  return { ok: true, message, data };
}

export function napaka(message: string, fieldErrors?: NapakePolj): ActionFail {
  return { ok: false, message, fieldErrors };
}

/** Ovoj okrog telesa akcije — nepričakovano napako spremeni v uporaben stavek. */
export async function runAction<T>(
  telo: () => Promise<ActionResult<T>>,
  izhod = `Sporočila ni bilo mogoče poslati. Pokličite na ${STRAN.telefon}.`,
): Promise<ActionResult<T>> {
  try {
    return await telo();
  } catch (e) {
    console.error("[akcija] nepričakovana napaka:", e);
    return napaka(izhod);
  }
}
