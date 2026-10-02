import type { MetadataRoute } from "next";

import { getPublishedPagesForSitemap } from "@/lib/pages/queries";
import { siteUrl } from "@/lib/config/siteUrl";
import { tiho } from "@/lib/tiho";

// ============================================================================
// Zemljevid strani
// ----------------------------------------------------------------------------
// Štiri strani, naštete na roko. Pri štirih je seznam v kodi bolj zanesljiv
// od samodejnega branja map: ko bo strani iz baze več, se bo bral iz nje —
// ne prej.
//
// `lastModified` je čas gradnje in ne današnji datum ob vsakem klicu. Datum,
// ki se spremeni vsak dan, iskalniku pove, da se vse strani vsak dan
// spreminjajo — in ko se to pokaže za neresnično, neha verjeti vsem.
// ============================================================================

// `revalidate` je ena ura, kot na drugih dveh straneh: pravna stran, ki
// nastane zdaj, je v zemljevidu najpozneje čez uro. Pogosteje nima smisla —
// iskalnik zemljevida tako ali tako ne bere ob vsaki spremembi.
export const revalidate = 3600;

const GRAJENO = new Date();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const osnova = siteUrl();
  const strani: Array<{ pot: string; pomen: number }> = [
    { pot: "/", pomen: 1 },
    { pot: "/ponudba", pomen: 0.9 },
    { pot: "/dela", pomen: 0.8 },
    { pot: "/kontakt", pomen: 0.7 },
  ];

  // VSE objavljene strani iz baze, ne samo tiste v nogi. Prej je zemljevid
  // bral strani noge: pravna besedila so se izpisala, nova pristajalna stran
  // pa ne bi — in stran, ki je v zemljevidu ni, iskalnik najde nazadnje ali
  // nikoli. Datum je pravi `updatedAt` in ne čas gradnje.
  const izBaze = await getPublishedPagesForSitemap().catch(
    tiho("zemljevid: strani iz baze", []),
  );

  return [
    ...strani.map((s) => ({
      url: `${osnova}${s.pot === "/" ? "" : s.pot}`,
      lastModified: GRAJENO,
      changeFrequency: "monthly" as const,
      priority: s.pomen,
    })),
    // Pravno besedilo se spremeni enkrat na leto in nikogar ne pripelje;
    // vsebinska stran je lahko glavni vhod z iskalnika. Zato ločena pomen in
    // pogostost, ne ene same vrednosti za vse iz baze.
    ...izBaze.map((s) => ({
      url: `${osnova}/${s.slug}`,
      lastModified: s.updatedAt ?? GRAJENO,
      changeFrequency: s.showInFooter ? ("yearly" as const) : ("monthly" as const),
      priority: s.showInFooter ? 0.2 : 0.7,
    })),
  ];
}
