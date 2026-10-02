import { Cookie, FileText, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { JsonLd } from "@/components/seo/JsonLd";
import { PravnaStran } from "@/components/sections/PravnaStran";
import { siteUrl } from "@/lib/config/siteUrl";
import { pripraviVsebino } from "@/lib/pages/kazalo";
import { getPublishedPage, getPublishedSlugs } from "@/lib/pages/queries";
import { tiho } from "@/lib/tiho";
import { drobtineLd } from "@/lib/seo/jsonLd";
import { sanitizeHtml } from "@/lib/rich-text/sanitize";

// ============================================================================
// /[slug] — strani iz baze (piškotki, zasebnost, pogoji, o gostilni …)
// ----------------------------------------------------------------------------
// Telo je bilo sanitizirano OB SHRANJEVANJU (`lib/pages/actions.ts`), zato je
// `dangerouslySetInnerHTML` tu varen. Če se kdaj doda druga pot vpisa v
// `Page.body`, mora tudi ta skozi `sanitizeHtml`.
//
// Lovilec stoji zadnji v (root): imenovane poti (/jedilnik, /novice …) imajo
// prednost, ker so statični segmenti. Da se kdo z lastno stranjo ne zaleti
// vanje, jih `REZERVIRANI_SLUGI` v obrazcu zavrne.
// ============================================================================

/**
 * Pravne strani nosijo svojo oznako in ikono.
 *
 * To je samo videz, ne shema: stran, ki je tu ni, se izriše z nevtralno
 * ikono dokumenta in oznako »Stran«.
 */
const PRAVNE: Record<string, { ikona: LucideIcon; oznaka: string }> = {
  piskotki: { ikona: Cookie, oznaka: "Piškotki" },
  zasebnost: { ikona: ShieldCheck, oznaka: "Zasebnost" },
  "pogoji-uporabe": { ikona: FileText, oznaka: "Pogoji" },
};

type Props = { params: Promise<{ slug: string }> };

export const revalidate = 300;

export async function generateStaticParams() {
  const strani = await getPublishedSlugs().catch(tiho("pravne strani: slugi", []));
  return strani.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const stran = await getPublishedPage(slug);
  if (!stran) return {};

  const naslov = stran.seoTitle ?? stran.title;
  const opis = stran.seoDescription ?? stran.excerpt ?? undefined;

  return {
    title: naslov,
    description: opis,
    alternates: { canonical: `${siteUrl()}/${stran.slug}` },
    // `images` je tu nujen: ko stran svoj `openGraph` sploh navede, Next
    // ne prišteje več slike iz `app/opengraph-image.tsx`. Piškotki,
    // zasebnost in pogoji so bili zato edine strani brez `og:image` —
    // povezava nanje se je v Messengerju odprla kot siv pravokotnik.
    openGraph: {
      title: naslov,
      description: opis,
      type: "article",
      // `url` in `siteName` sta tu iz istega razloga kot slika: ko stran
      // svoj `openGraph` sploh navede, Next ne prevzame več ničesar od
      // nadrejenega okvira. Brez njiju je povezava v Messengerju brez
      // imena hiše in brez naslova, na katerega bi kdo kliknil.
      url: `${siteUrl()}/${stran.slug}`,
      siteName: "Gostilnica Plus",
      locale: "sl_SI",
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
  };
}

export default async function DinamicnaStran({ params }: Props) {
  const { slug } = await params;
  const stran = await getPublishedPage(slug);
  if (!stran) notFound();

  const posodobljeno = new Intl.DateTimeFormat("sl-SI", {
    timeZone: "Europe/Ljubljana",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(stran.updatedAt);

  // Sidra in kazalo se izpeljejo iz naslovov v besedilu — tako jih dobi tudi
  // stran, ki jo kdo napiše v urejevalniku in `id` vanjo ne vpiše.
  const { html, sekcije } = pripraviVsebino(stran.body);
  const videz = PRAVNE[stran.slug] ?? { ikona: FileText, oznaka: "Stran" };

  return (
    <>
      {/* Drobtine tudi tu: pravna besedila so v iskalniku pogosto edina
          stran, ki se pokaže pod imenom domene, in brez poti nazaj je videti
          kot osirotel dokument. */}
      <JsonLd
        podatki={drobtineLd([
          { ime: "Domov", pot: "/" },
          { ime: stran.title, pot: `/${stran.slug}` },
        ])}
      />

      <PravnaStran
        nadnaslov={PRAVNE[stran.slug] ? "Pravno" : "Vsebina"}
        oznaka={videz.oznaka}
        ikona={videz.ikona}
        naslov={stran.title}
        uvod={stran.excerpt ?? undefined}
        posodobljeno={posodobljeno}
        sekcije={sekcije}
      >
        {/* Sanitizirano ob shranjevanju (`lib/pages/actions.ts`) IN znova tu.
            Prva obramba pade, če HTML pride v bazo po drugi poti — uvoz, ročni
            `UPDATE`, obnova kopije. Politika zasebnosti je zadnja stran, na
            kateri si to lahko privoščimo. */}
        <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
      </PravnaStran>
    </>
  );
}
