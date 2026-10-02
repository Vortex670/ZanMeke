import type { MetadataRoute } from "next";

import { siteUrl } from "@/lib/config/siteUrl";

// ============================================================================
// robots.txt
// ----------------------------------------------------------------------------
// Vse javno je odprto, admin in prijava sta zaprta — ne zaradi varnosti (ta
// stoji na seji in geslu), ampak zato, da se prijavna stran ne pojavi v
// rezultatih namesto domače.
//
// PAJKOV JEZIKOVNIH MODELOV NE ZAPIRAM. Marsikdo jih zapre po navadi, a za to
// stran so priložnost: kdor vpraša »kdo v Posavju naredi spletno stran za
// gostilno«, dobi odgovor iz strani, ki jih ti pajki preberejo. Zaprta vrata
// pomenijo, da me v takem odgovoru ni.
// ============================================================================

/**
 * Poti, ki jih pajek ne sme hoditi.
 *
 * Administracija in prijava imata `noindex` v metapodatkih, a to pomeni, da
 * mora pajek stran NAJPREJ prenesti, da to izve — in proračun za pajkanje
 * gre v strani, ki jih nihče ne sme videti.
 *
 * `/racun/` je zaprt iz drugega razloga: v naslovu je ŽETON. Plačilna stran
 * stranke v indeksu nima kaj iskati, in žeton v rezultatu iskanja je tiho
 * razkritje tujega računa.
 */
const ZAPRTO = ["/admin", "/prijava", "/api/", "/racun/"];

export default function robots(): MetadataRoute.Robots {
  const osnova = siteUrl();

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ZAPRTO },
      // IZRECNO IN NE SAMO PREK `*`. Nekateri od teh pajkov preberejo samo
      // pravilo s svojim imenom; pri drugih je izrecen vnos zavarovanje pred
      // tem, da bi kdo nekoč `*` zaprl in s tem tiho izklopil še te.
      ...["GPTBot", "OAI-SearchBot", "ClaudeBot", "PerplexityBot", "Google-Extended"].map(
        (userAgent) => ({ userAgent, allow: "/", disallow: ZAPRTO }),
      ),
    ],
    sitemap: `${osnova}/sitemap.xml`,
    host: osnova,
  };
}
