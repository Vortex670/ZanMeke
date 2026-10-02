import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { Parallax } from "@/components/motion/Parallax";
import type { Delo } from "@/lib/podatki";
import { cn } from "@/lib/utils";

// ============================================================================
// <VrsticaDela /> — eno delo čez vso širino zaslona
// ----------------------------------------------------------------------------
// Prej sta bili referenci dve majhni kartici v mreži. Posnetek strani je bil
// visok sto pikslov in se ni dalo videti ničesar — kartica je trdila, da
// nekaj obstaja, dokazala pa ni.
//
// Tu dobi vsaka referenca svojo vrstico čez ves zaslon: posnetek teče do
// roba stekla, besedilo stoji ob njem. Strani se izmenjujeta, da se dolg
// seznam ne bere kot tabela.
//
// Posnetek je VSEBINA in ne ozadje, zato `Parallax` dobi `z-0` — privzeto
// se postavi na `-z-10`, kjer bi pristal za ploskvijo.
// ============================================================================

export function VrsticaDela({
  delo,
  stevilka,
  obrnjeno = false,
}: {
  delo: Delo;
  /** »01«, »02« — pove, koliko jih je in katera je ta. */
  stevilka: string;
  /** Slika na desni namesto na levi. */
  obrnjeno?: boolean;
}) {
  const slika = delo.slika ? (
    <div className="bg-obrat relative aspect-[16/10] overflow-hidden lg:aspect-auto lg:h-full lg:min-h-[32rem]">
      <Parallax moc={10} className="z-0">
        <Image
          src={delo.slika}
          alt={`Spletna stran ${delo.ime}`}
          fill
          sizes="(min-width: 1024px) 55vw, 100vw"
          className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.02]"
        />
      </Parallax>
    </div>
  ) : null;

  const besedilo = (
    <div className="px-s3 py-s4 sm:px-s4 lg:py-s5 flex items-center">
      <div className="max-w-xl">
        {/* ČIGAVA JE STRAN, PIŠE PRVO. Oznaka »lastni projekt« je šibkejši
            dokaz od naročnikovega imena — in edina poštena, dokler stran ni
            naročnikova. Bralec, ki to izve sam, neha verjeti vsemu drugemu. */}
        <p className="type-poglavje text-bledo gap-s1 flex flex-wrap items-center">
          <span className="text-poudarek stevilke">{stevilka}</span>
          <span>{delo.stanje}</span>
          <span aria-hidden className="text-bledo/40">
            ·
          </span>
          <span>{delo.vrsta === "lastna" ? "lastni projekt" : "za naročnika"}</span>
        </p>

        <h3 className="type-h1 mt-s2">{delo.ime}</h3>
        <p className="type-small text-bledo mt-s1 stevilke">{delo.kje}</p>

        <p className="type-lead text-mirno mt-s3">{delo.izid}</p>

        {delo.url ? (
          <span className="type-label text-poudarek mt-s4 gap-s1 inline-flex items-center">
            Odpri stran
            <ArrowUpRight
              className="size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              strokeWidth={2}
              aria-hidden
            />
          </span>
        ) : null}
      </div>
    </div>
  );

  const vsebina = (
    <div
      className={cn(
        "grid items-stretch lg:grid-cols-[1.15fr_1fr]",
        obrnjeno && "lg:grid-cols-[1fr_1.15fr]",
      )}
    >
      {obrnjeno ? (
        <>
          {besedilo}
          {slika}
        </>
      ) : (
        <>
          {slika}
          {besedilo}
        </>
      )}
    </div>
  );

  const razred = "poln border-crta group block border-t";

  return delo.url ? (
    <a href={delo.url} target="_blank" rel="noopener noreferrer" className={razred}>
      {vsebina}
    </a>
  ) : (
    <article className={razred}>{vsebina}</article>
  );
}
