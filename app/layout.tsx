import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";

import { JsonLd } from "@/components/seo/JsonLd";
import { getNastavitve } from "@/lib/nastavitve/queries";
import { tiho } from "@/lib/tiho";
import { OPIS, STRAN } from "@/lib/podatki";
import { osebaLd, podjetjeLd, stranLd } from "@/lib/seo/jsonLd";

import "./globals.css";

// ============================================================================
// Ogrodje strani
// ----------------------------------------------------------------------------
// DVE PISAVI IN NIČ SERIFA.
//
// Prej sta bili tu Newsreader (serif) in Public Sans — isti par kot na
// gostilnica-plus.si. Posledica je bila, da sta se strani brali kot ena:
// serifni naslov, groteskne oznake, enaki razmiki. Za stran gostilne je
// serif pravi glas; za stran človeka, ki piše programe in fotografira, je
// tuj — in še huje, stranka, ki vidi obe, vidi en sam vzorec.
//
// Geist je groteskna pisava z navpično osjo in ozkimi vrzelmi; pri velikih
// naslovih z negativnim sledenjem je videti narejena in ne natipkana. Geist
// Mono nosi oznake, številke in sledi odsekov — mono pisava je v tem poklicu
// podpis in ne okras.
//
// Obe gresta skozi `next/font`, da se naložita s strani in ne iz tujega
// strežnika; brez tega je prvi izris brez pisave in se besedilo premakne.
//
// Opis strani je na enem mestu (`lib/podatki.ts`) in gre v naslov, v opis ter
// v JSON-LD. Tri mesta, ena resnica.
// ============================================================================

const geist = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--pisava-besedilo",
  display: "swap",
});

// Isti družini dve imeni: `--pisava-naslov` obstaja, ker ga uporablja
// `type-h1`, `type-display` in vse drugo v `globals.css`. Ko se naslovna
// pisava kdaj spremeni, se spremeni tu in nikjer drugje.
const naslov = Geist({
  subsets: ["latin", "latin-ext"],
  variable: "--pisava-naslov",
  display: "swap",
});

const oznaka = Geist_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--pisava-oznaka",
  display: "swap",
});

// NASLOV POVE OBOJE. Prejšnji je naštel samo spletne strani in za
// fotografijo se stran ni pojavila nikjer — kdor išče fotografa za gostilno,
// me ni našel, čeprav to delam.
const NASLOV_STRANI =
  "Žan Meke — izdelava spletnih strani in fotografija, Sevnica in Posavje";

export const metadata: Metadata = {
  metadataBase: new URL(STRAN.url),
  title: { default: NASLOV_STRANI, template: "%s · Žan Meke" },
  description: OPIS,
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "sl_SI",
    url: STRAN.url,
    siteName: STRAN.ime,
    title: NASLOV_STRANI,
    description: OPIS,
  },
  robots: {
    index: true,
    follow: true,
    // Googlu izrecno dovolimo celoten predogled: brez tega je izsek v
    // rezultatu odrezan na nekaj besed in slika se ne pokaže.
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  // Brez tega povezava na X nima velike slike, ampak drobno sličico ob
  // besedilu. Slika je ista kot za OG (`app/opengraph-image.tsx`) — druge
  // ni treba navesti, ker Next v tem primeru podeduje OG.
  twitter: { card: "summary_large_image" },
  // Ikona za »Dodaj na začetni zaslon« na iOS; Android jo vzame iz manifesta.
  icons: { apple: "/apple-ikona.png" },
  // Barva vrstice s stanjem na telefonu. Uvod vsake strani je temen, zato
  // mora biti tudi ta — sicer se nad temnim uvodom sveti svetel pas.
  other: { "theme-color": "#0f1513" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Profili za `sameAs`. Padec poizvedbe NE SME vzeti strani — brez njih so
  // strukturirani podatki le za odtenek šibkejši.
  const n = await getNastavitve().catch(tiho("layout: nastavitve", null));
  return (
    <html
      lang="sl"
      // `scroll-behavior: smooth` je v `globals.css`; brez tega atributa ga
      // Next ob prehodu med stranmi ne zna začasno izklopiti in skok na vrh
      // nove strani se vidi kot drsenje čez vso dolžino prejšnje.
      data-scroll-behavior="smooth"
      className={`${naslov.variable} ${oznaka.variable} ${geist.variable}`}
    >
      <body className="bg-papir text-crnilo flex min-h-svh flex-col">
        <JsonLd podatki={stranLd()} />
        <JsonLd podatki={osebaLd(n ?? undefined)} />
        <JsonLd podatki={podjetjeLd(n ?? undefined)} />
        {children}
        {/* Toast pove izid dejanja (oddano, ni šlo) — nikoli napake posameznega
            polja, te stojijo pod poljem, kjer jih je treba popraviti. */}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
