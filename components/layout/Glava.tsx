import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { STRAN } from "@/lib/podatki";

// ============================================================================
// Glava strani
// ----------------------------------------------------------------------------
// Glava LEŽI NA HEROJU in nima svoje podlage. Pas čez vrh bi stran razrezal na
// dvoje in prvi zaslon bi izgubil višino; tako pa se znamka, meni in dejanje
// berejo kot del iste slike. Vsaka stran se zato začne s temnim odsekom —
// to je pravilo postavitve, ne naključje.
//
// Dejanje je ENO in ima puščico v krogu: oko gre k njej tudi takrat, kadar
// človek besedila ne bere. Telefonska številka je v njej, ker je klic edino
// dejanje, ki na tej strani kaj prinese.
//
// NA TELEFONU JE MENI V DRUGI VRSTI in ne pod gumbom s tremi črtami. Poti so
// tri; hamburger bi jih skril za dotik, ki ga marsikdo ne naredi.
// ============================================================================

const MENI = [
  { href: "/ponudba", label: "Ponudba" },
  { href: "/dela", label: "Dela" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Glava() {
  return (
    <header className="text-na-obratu absolute inset-x-0 top-0 z-50">
      <div className="px-s2 gap-s3 mx-auto flex max-w-5xl items-center py-4">
        <Link href="/" className="min-w-0 leading-none">
          <span className="type-label block tracking-[0.22em] whitespace-nowrap">
            ŽAN MEKE
          </span>
          <span className="type-micro text-na-obratu/50 mt-1 block whitespace-nowrap">
            SPLETNE STRANI · FOTOGRAFIJA
          </span>
        </Link>

        <nav className="gap-s3 ml-auto hidden items-center sm:flex">
          {MENI.map((m, i) => (
            <Link
              key={m.href}
              href={m.href}
              className="type-label text-na-obratu/75 hover:text-na-obratu transition-colors"
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
          className="type-label bg-poudarek text-na-obratu group ml-auto inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5 whitespace-nowrap transition-opacity hover:opacity-90 sm:ml-0"
        >
          <span className="bg-na-obratu/15 inline-flex size-7 items-center justify-center rounded-full">
            <ArrowRight
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
              strokeWidth={2.2}
              aria-hidden
            />
          </span>
          <span className="stevilke">{STRAN.telefon}</span>
        </a>
      </div>

      {/* Telefon: poti v drugi vrsti, da so dosegljive brez dodatnega dotika. */}
      <nav className="border-na-obratu/10 border-y sm:hidden">
        <div className="px-s2 divide-na-obratu/10 mx-auto grid max-w-5xl grid-cols-3 divide-x">
          {MENI.map((m, i) => (
            <Link
              key={m.href}
              href={m.href}
              className="type-label text-na-obratu/75 active:text-na-obratu py-2.5 text-center"
            >
              <span className="text-na-obratu/35 stevilke mr-1">
                {String(i + 1).padStart(2, "0")}
              </span>
              {m.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
