import "server-only";

import Stripe from "stripe";

// ============================================================================
// lib/stripe/client.ts — povezava s Stripom
// ----------------------------------------------------------------------------
// Ista oblika kot na second-home.hr: leno ustvarjen odjemalec, strežniško in
// nikoli v brskalniku.
//
// GOSTOVANO PLAČILO (Stripe Checkout) in ne Stripe.js na strani: stranka gre
// na `checkout.stripe.com` in se vrne. S tem podatki o kartici nikoli ne
// gredo skozi to stran — in ni treba odpirati pravil CSP za tuje skripte.
//
// Ključa v kodi ni nikjer. Kadar ga ni v okolju, `jeStripePripravljen()`
// vrne `false` in gumb za plačilo se preprosto ne izriše — namesto da bi
// stranka pritisnila in dobila napako.
// ============================================================================

let odjemalec: Stripe | null = null;

export function jeStripePripravljen(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/**
 * Testni ključ pomeni, da plačila niso prava.
 *
 * Takrat mora stran to POVEDATI. Stran, ki v testnem načinu izgleda kot
 * prava, pripelje do tega, da nekdo plača s testno kartico in misli, da je
 * opravil — in to se opazi šele, ko denarja ni.
 */
export function jeStripeTestni(): boolean {
  return /^(sk|rk)_test_/.test(process.env.STRIPE_SECRET_KEY?.trim() ?? "");
}

export function getStripe(): Stripe {
  const kljuc = process.env.STRIPE_SECRET_KEY?.trim();
  if (!kljuc) {
    throw new Error("[stripe] STRIPE_SECRET_KEY ni nastavljen — plačila niso na voljo.");
  }
  if (!odjemalec) {
    odjemalec = new Stripe(kljuc, {
      appInfo: { name: "zanmeke.com", version: "1.0.0" },
      typescript: true,
    });
  }
  return odjemalec;
}

/**
 * Skrivnost za preverjanje webhooka.
 *
 * Dobiš jo ŠELE, ko je stran objavljena in ima Stripe kam pošiljati — zato
 * je lahko prazna in to ni napaka. Dokler je prazna, webhook zavrne vse
 * zahteve: nepodpisanega sporočila o plačilu ni mogoče ločiti od ponarejenega.
 */
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";
