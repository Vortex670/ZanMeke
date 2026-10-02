import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// <Zlozljivo /> — vprašanje in odgovor, ki se odpre
// ----------------------------------------------------------------------------
// Narejeno iz `<details>` in NE iz stanja v Reactu. Trije razlogi, vsi
// praktični:
//
// 1. Deluje brez JavaScripta. Prvo, kar nekatere povezave naredijo, je, da
//    odprejo stran v okrnjenem brskalniku (predogled v sporočilih, bralnik).
// 2. Brskalnikovo iskanje po strani (Ctrl+F) najde besedilo v zaprtem
//    odgovoru in ga odpre. Pri odgovoru, skritem z `hidden`, ga ne.
// 3. Tipkovnica in bralnik zaslona delujeta sama od sebe — `<summary>` je
//    gumb, ki ga ni treba izumljati.
//
// ODGOVOR JE V HTML-u TUDI, KO JE ZAPRT. To je pri vprašanjih bistveno: Google
// in jezikovni modeli berejo besedilo strani, in odgovor, ki se naloži šele ob
// kliku, zanje ne obstaja. Za iste odgovore poskrbi še `FAQPage` v JSON-LD.
// ============================================================================

export function Zlozljivo({
  vprasanje,
  children,
  /** Prvo naj bo odprto — da je takoj vidno, kakšne vrste odgovori so. */
  privzetoOdprto = false,
  className,
}: {
  vprasanje: string;
  children: ReactNode;
  privzetoOdprto?: boolean;
  className?: string;
}) {
  return (
    <details
      open={privzetoOdprto}
      className={cn(
        "border-crta-mehka group border-b",
        // Prehod višine ob odpiranju: `block-size` iz 0 v `auto`, kar je
        // mogoče šele z `interpolate-size: allow-keywords`. `content-visibility`
        // mora v isti prehod z `allow-discrete`, sicer vsebina izgine takoj
        // ob zapiranju in se višina animira v prazno.
        "[&::details-content]:overflow-hidden [&::details-content]:[block-size:0]",
        "[&::details-content]:transition-[block-size,content-visibility] [&::details-content]:duration-300",
        "[&::details-content]:[transition-behavior:allow-discrete]",
        "open:[&::details-content]:[block-size:auto]",
        className,
      )}
    >
      <summary
        className={cn(
          "type-h3 py-s2 gap-s2 flex cursor-pointer list-none items-center justify-between",
          "hover:text-poudarek transition-colors",
          // Trikotnik, ki ga Safari in Chrome narišeta sama, odstranimo —
          // svoj znak je na drugi strani in se obrne ob odprtju.
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        {vprasanje}
        <ChevronDown
          aria-hidden
          strokeWidth={1.8}
          className="text-bledo size-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
        />
      </summary>
      <div className={cn("type-body text-mirno pb-s3 mera")}>{children}</div>
    </details>
  );
}
