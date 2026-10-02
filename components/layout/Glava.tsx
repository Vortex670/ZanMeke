import Link from "next/link";

import { STRAN } from "@/lib/podatki";

// ============================================================================
// Glava strani
// ----------------------------------------------------------------------------
// Temna in enaka na vsaki strani. Dvoje jo dela: besedna znamka z zapisom,
// kaj človek dela, in ENA pilula z dejanjem — telefon. Vse drugo je meni.
//
// Meni je oštevilčen. To ni okras: številke povedo, da je poti malo in da so
// urejene po vrsti, v kateri jih kupec potrebuje — ponudba, dela, kontakt.
//
// Glava je temna tudi zunaj domače strani, zato ni treba loviti odmika ob
// drsenju: prehod iz temne glave v temen hero je zvezen, drugod pa je glava
// pas, ki stran drži skupaj.
// ============================================================================

const MENI = [
  { href: "/ponudba", label: "Ponudba" },
  { href: "/dela", label: "Dela" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Glava() {
  return (
    <header className="bg-obrat text-na-obratu sticky top-0 z-50">
      <div className="gap-s3 px-s2 mx-auto flex h-14 max-w-5xl items-center">
        <Link href="/" className="leading-none">
          <span className="type-label block tracking-[0.2em]">ŽAN MEKE</span>
          <span className="type-micro text-na-obratu/55 mt-0.5 block tracking-[0.1em]">
            SPLETNE STRANI · FOTOGRAFIJA
          </span>
        </Link>

        <nav className="gap-s3 ml-auto hidden items-center sm:flex">
          {MENI.map((m, i) => (
            <Link
              key={m.href}
              href={m.href}
              className="type-label text-na-obratu/70 hover:text-na-obratu transition-colors"
            >
              <span className="text-na-obratu/35 stevilke mr-1.5">
                {String(i + 1).padStart(2, "0")}
              </span>
              {m.label}
            </Link>
          ))}
        </nav>

        <a
          href={`tel:${STRAN.telefonKlic}`}
          className="type-label bg-poudarek text-na-obratu px-s2 ml-auto rounded-full py-2 sm:ml-0"
        >
          <span className="stevilke">{STRAN.telefon}</span>
        </a>
      </div>
    </header>
  );
}
