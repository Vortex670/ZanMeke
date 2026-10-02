// ============================================================================
// i18n/config.ts — jeziki strani
// ----------------------------------------------------------------------------
// zanmeke.com je ENOJEZIČEN. Datoteka vseeno obstaja, ker jo uporabljata
// `lib/pdf/format.ts` in `lib/pdf/labels.ts` — oblikovni sistem za PDF je
// prenesen z second-home.hr in se tam kopira 1 : 1. Da ostane kopija brez
// popravkov, dobi tu isti podpis z enim samim jezikom.
//
// Ko bo stran kdaj večjezična, se seznam razširi tu in nikjer drugje.
// ============================================================================

export const locales = ["sl"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "sl";

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

const localeToBcp47: Record<Locale, string> = { sl: "sl-SI" };

/** Oznaka BCP 47; neznan jezik pade na privzetega. */
export function bcp47(locale: string | null | undefined): string {
  return localeToBcp47[locale && isLocale(locale) ? locale : defaultLocale];
}
