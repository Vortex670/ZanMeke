// ============================================================================
// Oblikovanje vrednosti v PDF dokumentih — zneski, datumi, števila, DDV, IBAN.
// Brez odvisnosti (Intl only). Enaka imena funkcij kot na zanmeke.com; razlika
// je samo v tem, da je `locale` tukaj **jezik gosta** (hr/sl/de/en), ker
// second-home izda dokument v jeziku prejemnika.
// ============================================================================

import { defaultLocale, type Locale, bcp47, isLocale } from "@/i18n/config";

/** Privzet jezik dokumenta (hrvaški izdajatelj). */
export const PDF_LOCALE: Locale = defaultLocale;

/** Nedeljivi presledek — med številko in valuto / enoto, da se ne lomi. */
export const NBSP = " ";

/** Dokumenti so hrvaški — datumi se računajo v času izdajatelja. */
const TIME_ZONE = "Europe/Zagreb";

/**
 * `hr` → `hr-HR`; že razširjen BCP-47 niz se prepusti naprej.
 *
 * Zakaj ovoj in ne kar `bcp47()`: PDF-e izdajamo tudi za jezike, ki jih
 * stran ne ponuja (gost z računa iz druge države), zato neznan, a veljaven
 * niz BCP 47 spustimo skozi — `bcp47()` bi ga zamenjal s privzetim `hr-HR`.
 */
function intlLocale(locale: Locale | string): string {
  return isLocale(locale) ? bcp47(locale) : locale;
}

// Intl instance so drage; en `Map` na proces zadošča (ključ = locale + opcije).
const formatterCache = new Map<string, Intl.NumberFormat | Intl.DateTimeFormat>();

function numberFormat(locale: Locale | string, options: Intl.NumberFormatOptions) {
  const key = `n:${locale}:${JSON.stringify(options)}`;
  let f = formatterCache.get(key) as Intl.NumberFormat | undefined;
  if (!f) {
    f = new Intl.NumberFormat(intlLocale(locale), options);
    formatterCache.set(key, f);
  }
  return f;
}

function dateFormat(locale: Locale | string, options: Intl.DateTimeFormatOptions) {
  const key = `d:${locale}:${JSON.stringify(options)}`;
  let f = formatterCache.get(key) as Intl.DateTimeFormat | undefined;
  if (!f) {
    f = new Intl.DateTimeFormat(intlLocale(locale), {
      timeZone: TIME_ZONE,
      ...options,
    });
    formatterCache.set(key, f);
  }
  return f;
}

/** Vsi presledki v številskem nizu morajo biti nedeljivi (tudi tanki iz Intl). */
function nbsp(value: string): string {
  return value.replace(/[\s  ]/g, NBSP);
}

/**
 * Znesek v centih → jezik gosta prek `Intl.NumberFormat(locale, { currency })`:
 * `hr` "1.234,56 €" · `de` "1.234,56 €" · `en` "€1,234.56".
 */
export function formatMoney(
  cents: number,
  currency = "EUR",
  locale: Locale | string = PDF_LOCALE,
): string {
  return nbsp(
    numberFormat(locale, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      // Brez tega slovenska pravila ločijo tisočice šele pri petih števkah
      // in 1190 € se izpiše »1190,00 €«. Na listini je denar vedno s piko.
      useGrouping: "always",
    }).format(cents / 100),
  );
}

/** Negativen znesek za dobropis/storno: "−1.234,56 €" (pravi minus U+2212). */
export function formatMoneySigned(
  cents: number,
  currency = "EUR",
  locale: Locale | string = PDF_LOCALE,
): string {
  const abs = formatMoney(Math.abs(cents), currency, locale);
  return cents < 0 ? `−${abs}` : abs;
}

/** Število z lokalnimi ločili: 1234.5 → "1.234,5"; celo število brez decimalk. */
export function formatNumber(
  value: number,
  maxFractionDigits = 2,
  locale: Locale | string = PDF_LOCALE,
): string {
  return nbsp(
    numberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(value),
  );
}

/** Količina: "1", "2,5" — največ 3 decimalke. */
export function formatQuantity(
  value: number,
  locale: Locale | string = PDF_LOCALE,
): string {
  return formatNumber(value, 3, locale);
}

/** Stopnja DDV/PDV: 25 → "25 %", 13,5 → "13,5 %". */
export function formatVatRate(
  rate: number,
  locale: Locale | string = PDF_LOCALE,
): string {
  return `${formatNumber(rate, 2, locale)}${NBSP}%`;
}

/** Popust: 10 → "−10 %". */
export function formatDiscount(
  percent: number,
  locale: Locale | string = PDF_LOCALE,
): string {
  return `−${formatNumber(percent, 2, locale)}${NBSP}%`;
}

/** Datum "d. M. yyyy" → "11. 9. 2026" (nedeljivi presledki, da ostane v eni vrstici). */
export function formatDate(date: Date, locale: Locale | string = PDF_LOCALE): string {
  return nbsp(
    dateFormat(locale, { day: "numeric", month: "numeric", year: "numeric" }).format(
      date,
    ),
  );
}

/** Datum in ura "11. 9. 2026, 14:30". */
export function formatDateTime(date: Date, locale: Locale | string = PDF_LOCALE): string {
  const d = formatDate(date, locale);
  const t = dateFormat(locale, { hour: "2-digit", minute: "2-digit" }).format(date);
  return `${d}, ${t}`;
}

/** Rodilniška imena mesecev po jezikih — Intl vrne imenovalnik. */
const GENITIVE_MONTHS: Record<Locale, readonly string[]> = {
  sl: [
    "januarja",
    "februarja",
    "marca",
    "aprila",
    "maja",
    "junija",
    "julija",
    "avgusta",
    "septembra",
    "oktobra",
    "novembra",
    "decembra",
  ],
};

/**
 * Datum v rodilniku za rabo v stavku ("vrijedi do 7. srpnja 2026"). Klicatelj
 * lahko poda svoj seznam imen mesecev; privzeto se vzame po jeziku dokumenta.
 */
export function formatDateGenitive(
  date: Date,
  months: readonly string[] = GENITIVE_MONTHS[PDF_LOCALE],
) {
  return `${date.getDate()}.${NBSP}${months[date.getMonth()]}${NBSP}${date.getFullYear()}`;
}

/** Imena mesecev v rodilniku za dani jezik (za `formatDateGenitive`). */
export function genitiveMonths(locale: Locale): readonly string[] {
  return GENITIVE_MONTHS[locale];
}

/** IBAN v skupinah po 4: "HR1210010051863000160" → "HR12 1001 0051 8630 0016 0". */
export function formatIban(iban: string): string {
  const clean = iban.replace(/\s+/g, "").toUpperCase();
  return clean.match(/.{1,4}/g)?.join(" ") ?? clean;
}

/** Odstotek za popust/predplačilo v besedilu: 30 → "30 %". */
export function formatPercent(
  value: number,
  locale: Locale | string = PDF_LOCALE,
): string {
  return `${formatNumber(value, 2, locale)}${NBSP}%`;
}
