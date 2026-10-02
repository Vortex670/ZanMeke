import { Bell } from "lucide-react";

import { Gumb } from "@/components/ui/Gumb";
import type { PrijavljenUporabnik } from "@/lib/auth/seja";
import { odjavi } from "@/lib/prijava/actions";

// ============================================================================
// Glava administracije
// ----------------------------------------------------------------------------
// Desno stoji le tisto, kar je vedno isto: zvonec in račun. Ime strani in
// drobtine so v vsebini, ne tu — glava mora biti enaka na vsaki strani, da
// oko ne išče, kje se je kaj premaknilo.
//
// Odjava je OBRAZEC in ne povezava: odjava spremeni stanje, povezava sme
// samo peljati. Brskalnik, ki prednalaga povezave, bi te sicer lahko odjavil
// mimogrede.
// ============================================================================

export function AdminTopbar({ uporabnik }: { uporabnik: PrijavljenUporabnik }) {
  const zacetnica = uporabnik.ime.trim().charAt(0).toUpperCase() || "Ž";

  return (
    <header className="bg-surface border-chrome-line sticky top-0 z-40 flex h-16 items-center gap-(--s2) border-b px-(--s2)">
      <span className="sm:hidden">
        <span className="type-eyebrow text-text">
          ZANMEKE<span className="text-accent">.COM</span>
        </span>
      </span>

      <div className="ml-auto flex items-center gap-(--s2)">
        <span
          aria-hidden
          className="border-border text-subtle hidden size-10 items-center justify-center rounded-full border sm:inline-flex"
        >
          <Bell className="size-4" strokeWidth={1.8} />
        </span>

        <div className="border-border flex items-center gap-2.5 rounded-full border py-1.5 pr-3 pl-1.5">
          <span className="bg-accent text-accent-fg type-small inline-flex size-8 items-center justify-center rounded-full font-semibold">
            {zacetnica}
          </span>
          <span className="hidden leading-tight sm:block">
            <span className="type-small text-text block">{uporabnik.email}</span>
            <span className="type-micro text-accent block font-semibold tracking-[0.12em]">
              ADMIN
            </span>
          </span>
        </div>

        <form action={odjavi}>
          <Gumb type="submit" videz="obris" className="py-2">
            Odjava
          </Gumb>
        </form>
      </div>
    </header>
  );
}
