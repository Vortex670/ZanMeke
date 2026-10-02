import { siteUrl } from "@/lib/config/siteUrl";
import { DODATNO, PAKETI, STRAN } from "@/lib/podatki";

// ============================================================================
// Strukturirani podatki — kdo sem, kje sem, kaj delam in koliko stane
// ----------------------------------------------------------------------------
// Vse na enem mestu, ker se podatki ponovijo na več straneh in se morajo
// ujemati: različna telefonska številka v dveh zapisih je za Google znak, da
// podatku ni za verjeti.
//
// Vir resnice je `lib/podatki.ts` — tu se nič ne prepisuje na roko.
// ============================================================================

const ID_OSEBA = `${siteUrl()}/#oseba`;
const ID_PODJETJE = `${siteUrl()}/#podjetje`;

/**
 * Profili na drugih mestih (`sameAs`).
 *
 * To je edini način, da iskalnik in jezikovni model povežejo stran, Instagram
 * in Facebook v ENO osebo namesto v tri različne. Pri lokalnem izvajalcu je
 * ta povezava pogosto močnejši signal od besedila na strani — zato se povlečejo
 * iz nastavitev in se ne pišejo v kodo.
 */
export type Profili = {
  instagramUrl?: string;
  facebookUrl?: string;
  linkedinUrl?: string;
  googleUrl?: string;
};

function sameAs(p?: Profili): string[] {
  return [p?.instagramUrl, p?.facebookUrl, p?.linkedinUrl, p?.googleUrl].filter(
    (x): x is string => Boolean(x),
  );
}

/** Slika entitete — isti vir kot OG slika, da se ne razideta. */
const SLIKA = `${siteUrl()}/opengraph-image`;

/** Oseba — ker stranka najame človeka in ne znamke. */
export function osebaLd(profili?: Profili) {
  const povezave = sameAs(profili);
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": ID_OSEBA,
    name: STRAN.ime,
    url: siteUrl(),
    email: `mailto:${STRAN.epota}`,
    telephone: STRAN.telefonKlic,
    // Oboje, ker sta oboje: razvijalec IN fotograf. Če je zapisano samo eno,
    // se za drugo ne pojavim.
    jobTitle: "Spletni razvijalec in fotograf",
    image: SLIKA,
    ...(povezave.length > 0 ? { sameAs: povezave } : {}),
    knowsAbout: [
      "izdelava spletnih strani",
      "spletne strani za gostinstvo",
      "fotografija hrane",
      "fotografija prostorov",
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: STRAN.kraj,
      addressRegion: STRAN.obmocje,
      addressCountry: "SI",
    },
  };
}

/**
 * Lokalno podjetje s storitvami in cenami.
 *
 * `areaServed` je Posavje in ne Slovenija: kdor išče izvajalca v svojem
 * kraju, dobi raje tistega, ki je tam — in trditev, da pokrivam vso državo,
 * je za enega človeka tako ali tako neresnična.
 */
export function podjetjeLd(profili?: Profili) {
  const povezave = sameAs(profili);
  return {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "@id": ID_PODJETJE,
    name: STRAN.ime,
    url: siteUrl(),
    telephone: STRAN.telefonKlic,
    email: `mailto:${STRAN.epota}`,
    founder: { "@id": ID_OSEBA },
    image: SLIKA,
    logo: SLIKA,
    ...(povezave.length > 0 ? { sameAs: povezave } : {}),
    priceRange: "350–2990 €",
    currenciesAccepted: "EUR",
    address: {
      "@type": "PostalAddress",
      addressLocality: STRAN.kraj,
      addressRegion: STRAN.obmocje,
      addressCountry: "SI",
    },
    areaServed: [
      { "@type": "AdministrativeArea", name: "Posavje" },
      { "@type": "City", name: "Sevnica" },
      { "@type": "City", name: "Krško" },
      { "@type": "City", name: "Brežice" },
      { "@type": "City", name: "Radeče" },
    ],
    hasOfferCatalog: {
      "@type": "OfferCatalog",
      name: "Spletne strani in fotografija",
      itemListElement: [
        ...PAKETI.map((p) => ({
          "@type": "Offer",
          name: p.ime,
          description: p.komu,
          price: p.cena.replace(/[^\d]/g, ""),
          priceCurrency: "EUR",
          itemOffered: { "@type": "Service", name: `Izdelava spletne strani — ${p.ime}` },
        })),
        ...DODATNO.map((d) => ({
          "@type": "Offer",
          name: d.kaj,
          description: d.opis,
          priceCurrency: "EUR",
          itemOffered: { "@type": "Service", name: d.kaj },
        })),
      ],
    },
  };
}

/**
 * Priporočila strank kot `Review` ob podjetju.
 *
 * Isti stavek, ki ga na strani prebere človek, tu prebere iskalnik in
 * jezikovni model — in to je pogosto edini del strani, ki ga model v
 * odgovoru citira kot tuje mnenje in ne kot mojo trditev.
 *
 * BREZ `aggregateRating`: povprečna ocena iz dveh priporočil je številka,
 * ki je videti izmišljena, in Google za oceno brez ocenjevalnega sistema
 * zna zavrniti celoten zapis.
 */
export function priporocilaLd(
  seznam: Array<{ ime: string; hisa?: string | null; besedilo: string }>,
) {
  if (seznam.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@id": `${ID_PODJETJE}`,
    review: seznam.map((p) => ({
      "@type": "Review",
      reviewBody: p.besedilo,
      author: {
        "@type": "Person",
        name: p.ime,
        ...(p.hisa ? { worksFor: { "@type": "Organization", name: p.hisa } } : {}),
      },
      itemReviewed: { "@id": ID_PODJETJE },
    })),
  };
}

/**
 * Stran kot entiteta (`WebSite`).
 *
 * Brez nje sta na strani dve entiteti — oseba in podjetje — stran sama pa
 * ni nič. Iskalnik tako nima česa povezati z imenom domene, ime strani v
 * rezultatu pa si izmisli iz naslova zavihka. Isti zapis stoji na
 * gostilnica-plus.si in second-home.hr.
 */
export function stranLd() {
  const osnova = siteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${osnova}/#stran`,
    url: osnova,
    name: STRAN.ime,
    inLanguage: "sl-SI",
    publisher: { "@id": ID_PODJETJE },
  };
}

/**
 * Vprašanja in odgovori.
 *
 * Edini del strani, ki ga jezikovni model lahko citira kot odgovor na
 * uporabnikovo vprašanje — zato morajo biti odgovori taki, kot bi jih povedal
 * po telefonu: cela poved, brez sklicevanja na »zgoraj«.
 */
export function vprasanjaLd(vprasanja: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: vprasanja.map((v) => ({
      "@type": "Question",
      name: v.q,
      acceptedAnswer: { "@type": "Answer", text: v.a },
    })),
  };
}

/** Pot do strani, da se v rezultatu izriše drobtinica namesto naslova. */
export function drobtineLd(koraki: Array<{ ime: string; pot: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: koraki.map((k, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: k.ime,
      item: `${siteUrl()}${k.pot}`,
    })),
  };
}
