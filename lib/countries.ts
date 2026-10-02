

/**
 * ISO-3166-1 alpha-2 country list + locale-aware ime resolver.
 *
 * **Zakaj curated lista, ne full 249-countries?**
 *   Admin vmesnik je single-tenant: Second-Home.hr team + prihodnji userji
 *   (ko odpremo javno registracijo). ~55 kod pokriva:
 *     - Hrvaška + sosede + Balkan.
 *     - EU27 (top izvorni trgi gostov).
 *     - Anglosaške + off-shore (UK, US, CA, AU, NZ).
 *     - Top Azijska (JP, KR, CN) + ostale turistično aktualne (IL, TR, UA).
 *
 *   User se v 55 postavkah orientira lažje kot v 249.
 *
 *   Iz podatkovnih vrednosti je ISO-3166 alpha-2 → forward-compatible s
 *   katerim koli prihodnjim full-list migration-om brez DB migracije.
 *
 * **Imena:**
 *   Ne hardcode-amo imen v code (220+ stringov × 4 locale-i). Namesto tega
 *   `Intl.DisplayNames` — nativna API, locale-aware, brezplačno poznam ime
 *   vsake kode v hr/sl/de/en/… brez shipanja tabel. SSR-safe (Node 18+).
 *
 *   Fallback `displayNames.of(code)` lahko vrne `undefined` za eksotične
 *   kode — pade na sam code ("XK" → "XK"). V praksi vseh 55 naših kod
 *   vrne polno ime.
 *
 * **Sort:**
 *   1. HR (default + business lokacija) — vedno prvi.
 *   2. Sosede + Balkan (SI, BA, ME, RS, MK, XK, AL, BG) — drugič.
 *   3. Ostale alphabetsko **v trenutnem locale-u** (Intl.Collator.compare).
 *
 *   Alphabetical sort se izvaja ob render-u (server component / client mount),
 *   zato se ordering prilagodi locale-u (npr. "Nemčija" v sl vs "Njemačka"
 *   v hr sta na različnih mestih v seznamu). To je zaželjeno — user
 *   pričakuje, da so države razvrščene po njegovem jeziku.
 */

/** Fiksne prve kode — uredjene po **dejanski turistični populaciji** na
 *  Dalmaciji (Nemci + Avstrijci + Čehi + Švicarji + Italijani). Slovenci in
 *  Hrvati so v resnici manjši delež gostov kot OTA stran statistike predvidijo. */
const PRIORITY_CODES: readonly string[] = [
  "DE",
  "AT",
  "CH",
  "CZ",
  "SK",
  "IT",
  "HU",
  "PL",
  "NL",
  "HR",
  "SI",
] as const;

/** Ostale države — alphabetsko sort-ane ob render-u v trenutnem locale-u. */
const ALPHABETICAL_CODES: readonly string[] = [
  "AT",
  "AU",
  "BE",
  "BY",
  "BR",
  "CA",
  "CH",
  "CN",
  "CY",
  "CZ",
  "DE",
  "DK",
  "EE",
  "ES",
  "FI",
  "FR",
  "GB",
  "GR",
  "HU",
  "IE",
  "IL",
  "IN",
  "IS",
  "IT",
  "JP",
  "KR",
  "LT",
  "LU",
  "LV",
  "MT",
  "MX",
  "NL",
  "NO",
  "NZ",
  "PL",
  "PT",
  "RO",
  "RU",
  "SE",
  "SK",
  "TR",
  "UA",
  "US",
  "ZA",
] as const;

/** Vse dovoljene kode — union priority + alphabetical, **dedup**.
 *  PRIORITY_CODES vsebuje nekatere kode, ki so tudi v ALPHABETICAL_CODES
 *  (DE, AT, CH, CZ, SK, IT, HU, PL, NL) — brez Set-a bi React dropdown
 *  renderal podvojene `key` prop-e in kršil invariant. */
const COUNTRY_CODES: readonly string[] = Array.from(
  new Set<string>([...PRIORITY_CODES, ...ALPHABETICAL_CODES]),
);

/** Set za O(1) lookup v Zod .refine(). */
export const COUNTRY_CODE_SET: ReadonlySet<string> = new Set(COUNTRY_CODES);

/**
 * ITU-T E.164 klicne kode (country calling codes) za vsako kodo iz
 * `COUNTRY_CODES`. Vir: ITU-T Rec. E.164 + Wikipedia "List of country
 * calling codes" (cross-ref april 2026).
 *
 * **Format:** `"+385"` (vedno z vodilnim `+`, brez presledkov).
 *   - Single code per country (naša lista ne vsebuje delečih se kod kot
 *     NANP, kjer ima več držav `+1` — ampak tudi če bi imela, bi
 *     vsaka ISO koda kazala na isto klicno kodo).
 *
 * **Zakaj tu in ne v libphonenumber-js:**
 *   - libphonenumber-js bundle je ~80 KB gzipped za "mobile" dataset.
 *   - Mi potrebujemo SAMO dial code za display — ne strict format validate,
 *     ne parse, ne regional normalize. ~55 kod × "+NNN" = < 1 KB podatkov.
 *   - Če v prihodnosti rabimo strict phone validation (obveznost E.164,
 *     region-specific formatting), switch na libphonenumber-js tukaj
 *     brez breaking change-a v callsite-ih.
 *
 * **Opombe:**
 *   - XK (Kosovo) — formalno `+383` od leta 2017 (ITU-T odobrila po
 *     dolgem političnem blokadi).
 *   - BA (Bosnia & Herzegovina) → `+387`.
 *   - BE (Belgium) → `+32`, ne +320.
 *   - Koordinate ZA (Južna Afrika) → `+27`.
 */
const DIAL_CODES: Readonly<Record<string, string>> = {
  // Priority (HR + sosede + Balkan)
  HR: "+385",
  SI: "+386",
  BA: "+387",
  ME: "+382",
  RS: "+381",
  MK: "+389",
  XK: "+383",
  AL: "+355",
  BG: "+359",
  // Alphabetical
  AT: "+43",
  AU: "+61",
  BE: "+32",
  BY: "+375",
  BR: "+55",
  CA: "+1",
  CH: "+41",
  CN: "+86",
  CY: "+357",
  CZ: "+420",
  DE: "+49",
  DK: "+45",
  EE: "+372",
  ES: "+34",
  FI: "+358",
  FR: "+33",
  GB: "+44",
  GR: "+30",
  HU: "+36",
  IE: "+353",
  IL: "+972",
  IN: "+91",
  IS: "+354",
  IT: "+39",
  JP: "+81",
  KR: "+82",
  LT: "+370",
  LU: "+352",
  LV: "+371",
  MT: "+356",
  MX: "+52",
  NL: "+31",
  NO: "+47",
  NZ: "+64",
  PL: "+48",
  PT: "+351",
  RO: "+40",
  RU: "+7",
  SE: "+46",
  SK: "+421",
  TR: "+90",
  UA: "+380",
  US: "+1",
  ZA: "+27",
} as const;

/**
 * Vrne klicno kodo za dano ISO-3166 alpha-2 kodo (npr. "HR" → "+385").
 * Za neznane kode vrne prazen string (UI ga ne bo pokazal).
 */
export function getCountryDialCode(code: string): string {
  return DIAL_CODES[code.toUpperCase()] ?? "";
}

/**
 * Vrne human-readable ime države v danem locale-u. Za neznane kode vrne code
 * kot fallback (da UI ne crashne).
 */
export function getCountryName(code: string, locale: string): string {
  try {
    const dn = new Intl.DisplayNames([locale], { type: "region" });
    return dn.of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/**
 * Vrne regional-indicator emoji zastavo iz ISO-3166 kode. Deterministic
 * char transformation: 'H' → 🇭, 'R' → 🇷 → "🇭🇷".
 *
 * Delazmoren samo za 2-črkovne alpha kode (torej naš cel seznam).
 */
export function getCountryFlag(code: string): string {
  if (code.length !== 2) return "";
  const base = 0x1f1e6; // 'A' (regional indicator)
  const A = "A".charCodeAt(0);
  const up = code.toUpperCase();
  return String.fromCodePoint(
    base + (up.charCodeAt(0) - A),
    base + (up.charCodeAt(1) - A),
  );
}

/**
 * Vrne urejen seznam držav za dropdown v danem locale-u.
 *   1. Priority kode (HR + sosede + Balkan) v fiksnem redu.
 *   2. Alphabetical kode sort-ane po imenu v trenutnem locale-u
 *      (`Intl.Collator`, ki pravilno razvrsti lokalizirane znake —
 *      "Češka" po "C" ne "Č", "Švedska" po "S" ne "Š", itd.).
 */
export function getOrderedCountries(locale: string): ReadonlyArray<{
  code: string;
  name: string;
  flag: string;
  dialCode: string;
}> {
  const tag = locale;
  const collator = new Intl.Collator(tag, { sensitivity: "base" });
  const dn = new Intl.DisplayNames([tag], { type: "region" });

  const prioritySet = new Set<string>(PRIORITY_CODES);

  const priority = PRIORITY_CODES.map((code) => ({
    code,
    name: dn.of(code) ?? code,
    flag: getCountryFlag(code),
    dialCode: getCountryDialCode(code),
  }));

  // Rest = alphabetical MINUS priority (dedup) → brez podvojenih ključev
  // v React dropdown-u in brez podvojenih zapisov v seznamu.
  const rest = ALPHABETICAL_CODES.filter((code) => !prioritySet.has(code))
    .map((code) => ({
      code,
      name: dn.of(code) ?? code,
      flag: getCountryFlag(code),
      dialCode: getCountryDialCode(code),
    }))
    .sort((a, b) => collator.compare(a.name, b.name));

  return [...priority, ...rest];
}
