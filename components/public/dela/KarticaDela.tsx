import Image from "next/image";

import type { Delo } from "@/lib/podatki";

// ============================================================================
// <KarticaDela /> — eno delo s posnetkom žive strani
// ----------------------------------------------------------------------------
// Posnetek je tu z razlogom: podjetnik, ki te ne pozna, ne bo bral treh
// odstavkov, da bi ugotovil, ali znaš. Slika mu to pove v sekundi, besedilo
// pod njo pa pove tisto, česar slika ne more — kaj lastniku vsak dan prihrani.
//
// Cela kartica je povezava na ŽIVO stran in ne na podstran s podrobnostmi.
// Živa stran je močnejši dokaz od vsakega opisa.
// ============================================================================

export function KarticaDela({ delo }: { delo: Delo }) {
  const vsebina = (
    <>
      {delo.slika ? (
        <div className="border-crta bg-ploskev relative aspect-[1200/630] overflow-hidden border-b">
          <Image
            src={delo.slika}
            alt={`Spletna stran ${delo.ime}`}
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            className="object-cover object-top"
          />
        </div>
      ) : null}

      <div className="p-s3">
        <div className="gap-s1 flex items-baseline">
          <h3 className="type-h3">{delo.ime}</h3>
          <span className="type-micro text-bledo">{delo.kje}</span>
          <span className="type-label text-poudarek ml-auto whitespace-nowrap">
            {delo.stanje}
          </span>
        </div>
        <p className="type-body text-mirno mt-s1">{delo.izid}</p>
      </div>
    </>
  );

  const razred =
    "border-crta bg-ploskev group block overflow-hidden border transition-colors";

  return delo.url ? (
    <a
      href={delo.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`${razred} hover:border-poudarek`}
    >
      {vsebina}
    </a>
  ) : (
    <article className={razred}>{vsebina}</article>
  );
}
