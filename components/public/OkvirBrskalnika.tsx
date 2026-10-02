import Image from "next/image";

import { Nagib3D } from "@/components/motion/Nagib3D";
import { cn } from "@/lib/utils";

// ============================================================================
// <OkvirBrskalnika /> — posnetek žive strani v okvirju
// ----------------------------------------------------------------------------
// Okvir ni okras: posnetek brez njega je videti kot slika, posnetek v okvirju
// pa kot stran, ki jo je mogoče odpreti. Naslov domene v vrstici zgoraj je
// najmočnejši del — pove, da gre za nekaj, kar v tem trenutku živi.
//
// Ista komponenta na domači strani in pri delih, da se okvir ne razide po
// dveh mestih. Ko sta bila dva prepisa, je imel en 12 px radij in drugi 8.
// ============================================================================

export function OkvirBrskalnika({
  slika,
  alt,
  domena,
  /** Prvi zaslon naj se naloži prednostno; ostali ne. */
  prednostno = false,
  /** Nagib v prostoru — na domači strani da, v dolgem seznamu ne. */
  vProstoru = true,
  className,
}: {
  slika: string;
  alt: string;
  domena: string;
  prednostno?: boolean;
  vProstoru?: boolean;
  className?: string;
}) {
  const okvir = (
    <div
      className={cn(
        "border-crta bg-obrat overflow-hidden rounded-xl border",
        // Na temnem herojo je bil posnetek temen na temnem in se je zlival.
        // Svetel notranji rob ga dvigne s ploskve, sij v barvi poudarka pa
        // pove, da je to stvar, ki jo je vredno pogledati — brez okvirja iz
        // barve, ki bi tekmoval z gumbom.
        "shadow-[0_24px_64px_-24px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.06)_inset]",
        className,
      )}
    >
      <div className="border-na-obratu/10 bg-obrat flex items-center gap-1.5 border-b px-3 py-2">
        <span aria-hidden className="bg-na-obratu/20 size-2 rounded-full" />
        <span aria-hidden className="bg-na-obratu/20 size-2 rounded-full" />
        <span aria-hidden className="bg-na-obratu/20 size-2 rounded-full" />
        <span className="type-micro text-na-obratu/40 ml-2 truncate">{domena}</span>
      </div>
      <Image
        src={slika}
        alt={alt}
        width={1200}
        height={630}
        priority={prednostno}
        // `priority` sam pove brskalniku, naj sliko prednostno PRENESE, ne
        // pa tudi, naj je ne odloži. Posnetek v herojo je največji izris na
        // strani (LCP) in odložena naložitev ga zamakne za toliko, kolikor
        // traja, da se stran postavi — zato `eager`, kadar je nad pregibom.
        loading={prednostno ? "eager" : "lazy"}
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="w-full"
      />
    </div>
  );

  return vProstoru ? <Nagib3D>{okvir}</Nagib3D> : okvir;
}
