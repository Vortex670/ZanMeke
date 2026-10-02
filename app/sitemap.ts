import type { MetadataRoute } from "next";

import { getFooterPages } from "@/lib/pages/queries";
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

  // Pravna besedila so v bazi in so bila doslej v zemljevidu izpuščena —
  // povezane so iz noge vsake strani, iskalnik pa zanje ni vedel. Datum je
  // njihov pravi `updatedAt`, ne čas gradnje: pri pravnem besedilu je datum
  // zadnje spremembe podatek in ne okras.
  const pravne = await getFooterPages().catch(tiho("zemljevid: pravne strani", []));

  return [
    ...strani.map((s) => ({
      url: `${osnova}${s.pot === "/" ? "" : s.pot}`,
      lastModified: GRAJENO,
      changeFrequency: "monthly" as const,
      priority: s.pomen,
    })),
    ...pravne.map((s) => ({
      url: `${osnova}/${s.slug}`,
      lastModified: s.updatedAt ?? GRAJENO,
      changeFrequency: "yearly" as const,
      priority: 0.2,
    })),
  ];
}
