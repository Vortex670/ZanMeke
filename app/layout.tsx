import type { Metadata } from "next";
import { Archivo, Newsreader, Public_Sans } from "next/font/google";
import { Toaster } from "sonner";

import { Glava } from "@/components/layout/Glava";
import { Noga } from "@/components/layout/Noga";
import { OPIS, STRAN } from "@/lib/podatki";

import "./globals.css";

// ============================================================================
// Ogrodje strani
// ----------------------------------------------------------------------------
// Pisavi: Archivo za naslove (ima hrbtenico in ni Inter, ki ga ima pol
// spleta) in Public Sans za besedilo. Obe prek `next/font`, da se naložita s
// strani in ne iz tujega strežnika — brez tega je prvi izris brez pisave in
// se besedilo ob naložitvi premakne.
//
// Opis strani je na enem mestu (`lib/podatki.ts`) in gre v naslov, v opis ter
// v JSON-LD. Tri mesta, ena resnica.
// ============================================================================

// Serif za naslove, groteskna za oznake in številke, Public Sans za branje.
// Tri pisave zato, ker vsaka opravlja svoje: serif da naslovu obraz, grotesk
// drži oznake in številke pokonci, telo pa mora biti berljivo in nič več.
const naslov = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--pisava-naslov",
  display: "swap",
});

const oznaka = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600", "700"],
  variable: "--pisava-oznaka",
  display: "swap",
});

const besedilo = Public_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600"],
  variable: "--pisava-besedilo",
  display: "swap",
});

const NASLOV_STRANI = "Žan Meke — spletne strani za gostilne in podjetja v Posavju";

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
  robots: { index: true, follow: true },
};

/**
 * JSON-LD: lokalno podjetje z območjem, ki ga pokriva.
 *
 * Brez tega Google ve, da stran obstaja, ne ve pa, da gre za izvajalca iz
 * Sevnice, ki dela po Posavju — in prav to iščejo ljudje, ki tipkajo
 * »izdelava spletnih strani Krško«.
 */
function JsonLd() {
  const podatki = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: STRAN.ime,
    description: OPIS,
    url: STRAN.url,
    telephone: STRAN.telefonKlic,
    email: STRAN.epota,
    address: {
      "@type": "PostalAddress",
      addressLocality: STRAN.kraj,
      addressCountry: "SI",
    },
    areaServed: STRAN.obmocje,
    knowsLanguage: "sl",
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(podatki) }}
    />
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="sl"
      className={`${naslov.variable} ${oznaka.variable} ${besedilo.variable}`}
    >
      <body className="bg-papir text-crnilo flex min-h-svh flex-col">
        <JsonLd />
        <Glava />
        <main className="flex-1">{children}</main>
        <Noga />
        {/* Toast pove izid dejanja (oddano, ni šlo) — nikoli napake posameznega
            polja, te stojijo pod poljem, kjer jih je treba popraviti. */}
        <Toaster position="bottom-center" richColors closeButton />
      </body>
    </html>
  );
}
