// ============================================================================
// lib/posta/katalog.ts — kaj je katera e-pošta in kdaj gre ven
// ----------------------------------------------------------------------------
// Ista razdelitev kot na gostilnica-plus.si in second-home.hr: katalog nosi
// PODATKE za administracijo (razdelek, prejemnik, sprožilec, spremenljivke),
// predogled pa žive vsebine (`lib/posta/predogled.tsx`). Nova predloga = vpis
// na obeh mestih; brez vpisa je pošta, ki je v adminu nihče ne vidi.
//
// »Sprožilec« je slovenska poved in ne ime funkcije: vedeti moraš, KDAJ to
// pošto kdo dobi, ne kje je v kodi. Za to je `izvor`.
// ============================================================================

export const POSTA_KATEGORIJE = ["stranke", "racuni", "racun-in-varnost"] as const;
export type PostaKategorija = (typeof POSTA_KATEGORIJE)[number];

export const POSTA_KATEGORIJA_NAPIS: Record<PostaKategorija, string> = {
  stranke: "Stranke",
  racuni: "Računi",
  "racun-in-varnost": "Račun in varnost",
};

/**
 * Ali predloga že ima svoj sprožilec.
 *
 * »Pripravljena« pomeni: besedilo in oblika sta narejena, pošiljanja pa še
 * ni. To mora biti v adminu vidno, sicer kdo čaka pošto, ki ne bo prišla.
 */
export type PostaStanje = "v-uporabi" | "pripravljena";

export const POSTA_PREJEMNIKI = ["stranka", "jaz"] as const;
export type PostaPrejemnik = (typeof POSTA_PREJEMNIKI)[number];

export const POSTA_PREJEMNIK_NAPIS: Record<PostaPrejemnik, string> = {
  stranka: "Stranki",
  jaz: "Meni",
};

export type PostaSpremenljivka = { ime: string; primer: string };

export type PostaPredloga = {
  /** Ključ v naslovu `/admin/posta/[kljuc]` in v predogledu. */
  kljuc: string;
  ime: string;
  kategorija: PostaKategorija;
  prejemnik: PostaPrejemnik;
  /** Kdaj se pošlje — v slovenščini. */
  sprozilec: string;
  /** Kje v kodi se sproži. */
  izvor: string;
  stanje: PostaStanje;
  zadeva: string;
  spremenljivke: PostaSpremenljivka[];
};

export const POSTA_PREDLOGE: readonly PostaPredloga[] = [
  {
    kljuc: "povprasevanje-prejeto",
    ime: "Novo povpraševanje",
    kategorija: "stranke",
    prejemnik: "jaz",
    sprozilec: "Ko kdo odda obrazec na strani Kontakt.",
    izvor: "lib/kontakt/actions.ts",
    stanje: "v-uporabi",
    zadeva: "Povpraševanje — {ime}, {podjetje}",
    spremenljivke: [
      { ime: "ime", primer: "Marko Novak" },
      { ime: "podjetje", primer: "Gostilna Pri Treh Lipah" },
      { ime: "telefon", primer: "041 234 567" },
      { ime: "zanimanje", primer: "Spletna stran" },
    ],
  },
  {
    kljuc: "povprasevanje-potrditev",
    ime: "Potrdilo o povpraševanju",
    kategorija: "stranke",
    prejemnik: "stranka",
    sprozilec: "Takoj po oddaji obrazca, če je stranka pustila e-pošto.",
    izvor: "lib/kontakt/actions.ts",
    stanje: "pripravljena",
    zadeva: "Vaše povpraševanje je prispelo",
    spremenljivke: [
      { ime: "ime", primer: "Marko" },
      { ime: "telefon", primer: "041 401 521" },
    ],
  },
  {
    kljuc: "racun-povezava",
    ime: "Račun ali predračun",
    kategorija: "racuni",
    prejemnik: "stranka",
    sprozilec: "Ko v adminu pošlješ povezavo za plačilo.",
    izvor: "lib/racuni/actions.ts",
    stanje: "pripravljena",
    zadeva: "{vrsta} {stevilka} — {znesek}",
    spremenljivke: [
      { ime: "vrsta", primer: "Račun" },
      { ime: "stevilka", primer: "2026-001" },
      { ime: "znesek", primer: "895,00 €" },
      { ime: "placilnaUrl", primer: "https://zanmeke.com/racun/…" },
    ],
  },
  {
    kljuc: "vabilo",
    ime: "Vabilo k sodelovanju",
    kategorija: "stranke",
    prejemnik: "stranka",
    sprozilec: "Pišeš ga ti, hiši, ki te še ne pozna. Stran ga ne pošilja sama.",
    izvor: "ročno — emails/Vabilo.tsx",
    stanje: "pripravljena",
    zadeva: "{hisa} — predlog za spletno stran",
    spremenljivke: [
      { ime: "hisa", primer: "Gostilna Pri Treh Lipah" },
      { ime: "opazka", primer: "Malico objavljate na Facebooku, na strani je ni." },
      { ime: "predlog", primer: "Vpišete jo enkrat, ob osmih je pri gostih." },
      { ime: "url", primer: "https://zanmeke.com/dela" },
    ],
  },
  {
    kljuc: "opomnik-placila",
    ime: "Opomnik za plačilo",
    kategorija: "racuni",
    prejemnik: "stranka",
    sprozilec: "Ko račun zapade in plačila ni.",
    izvor: "ročno iz /admin/racuni",
    stanje: "pripravljena",
    zadeva: "Opomnik — račun {stevilka}",
    spremenljivke: [
      { ime: "stevilka", primer: "2026-001" },
      { ime: "znesek", primer: "895,00 €" },
      { ime: "zapadlost", primer: "15. oktobra" },
      { ime: "placilnaUrl", primer: "https://zanmeke.com/racun/…" },
    ],
  },
  {
    kljuc: "potrdilo-placila",
    ime: "Potrdilo o plačilu",
    kategorija: "racuni",
    prejemnik: "stranka",
    sprozilec: "Ko Stripe potrdi plačilo ali ko sam označiš nakazilo.",
    izvor: "app/api/stripe/webhook/route.ts",
    stanje: "pripravljena",
    zadeva: "Plačilo prejeto — {znesek}",
    spremenljivke: [
      { ime: "stevilka", primer: "2026-001" },
      { ime: "znesek", primer: "895,00 €" },
      { ime: "datum", primer: "3. oktober 2026" },
      { ime: "naslednjiKorak", primer: "Jutri pridem po fotografije." },
    ],
  },
  {
    kljuc: "geslo-ponastavitev",
    ime: "Ponastavitev gesla",
    kategorija: "racun-in-varnost",
    prejemnik: "jaz",
    sprozilec: "Ko na prijavni strani zahtevaš novo geslo.",
    izvor: "lib/prijava/geslo-actions.ts",
    stanje: "v-uporabi",
    zadeva: "Povezava za novo geslo",
    spremenljivke: [
      { ime: "ime", primer: "Žan" },
      { ime: "ponastavitevUrl", primer: "https://zanmeke.com/prijava/geslo/…" },
      { ime: "veljavnost", primer: "60 minut" },
    ],
  },
];

export function najdiPredlogo(kljuc: string): PostaPredloga | undefined {
  return POSTA_PREDLOGE.find((p) => p.kljuc === kljuc);
}
