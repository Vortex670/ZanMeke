import "server-only";

import argon2 from "argon2";

// ============================================================================
// lib/auth/geslo.ts — geslo se nikoli ne shrani
// ----------------------------------------------------------------------------
// argon2id: odporen na strojno pospešeno ugibanje in priporočen privzetek.
// Nastavitve so tu, na enem mestu — ko bo strežnik močnejši, se dvignejo tu
// in nikjer drugje.
//
// `preveri` vrne false tudi ob poškodovanem zapisu: napaka pri razčlenjevanju
// zapisa ne sme nikoli pomeniti uspešne prijave.
// ============================================================================

const NASTAVITVE = {
  type: argon2.argon2id,
  memoryCost: 19456, // 19 MiB — priporočilo OWASP
  timeCost: 2,
  parallelism: 1,
} as const;

export async function zasifriraj(geslo: string): Promise<string> {
  return argon2.hash(geslo, NASTAVITVE);
}

export async function preveri(zapis: string, geslo: string): Promise<boolean> {
  try {
    return await argon2.verify(zapis, geslo);
  } catch {
    return false;
  }
}
