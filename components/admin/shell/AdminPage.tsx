import type { ReactNode } from "react";

import { AdminFooter } from "@/components/admin/shell/AdminFooter";
import { AdminSidebar } from "@/components/admin/shell/AdminSidebar";
import { AdminTopbar } from "@/components/admin/shell/AdminTopbar";
import { razlicicaStrani } from "@/lib/admin/brand";
import type { PrijavljenUporabnik } from "@/lib/auth/seja";

// ============================================================================
// Okvir ene admin strani
// ----------------------------------------------------------------------------
// Vrstni red je predpisan in enak na vseh treh straneh:
//
//   oznaka (kje sem) → naslov → kratek opis → desni slot (obdobje, dejanje)
//   → vsebina
//
// Predpisan zato, ker se administracija bere s kotičkom očesa: ko je naslov
// vedno na istem mestu, se ne iščeta ne stran ne dejanje.
//
// Vsebina teče čez vso širino desno od stranske vrstice in ni centrirana:
// administracija je delovna miza, ne članek. Seznam s sedmimi stolpci na
// širokem zaslonu potrebuje prostor, ne enakih robov na obeh straneh.
// ============================================================================

export function AdminPage({
  uporabnik,
  oznaka,
  naslov,
  opis,
  desno,
  znacke,
  razlicica,
  children,
}: {
  uporabnik: PrijavljenUporabnik;
  /** Kje sem — npr. »Pregled · 7 dni«. */
  oznaka: string;
  naslov: ReactNode;
  opis?: ReactNode;
  /** Desno od naslova: izbira obdobja, gumb. */
  desno?: ReactNode;
  znacke?: Record<string, number>;
  razlicica?: string;
  children: ReactNode;
}) {
  return (
    <div className="bg-bg text-text flex min-h-svh">
      <AdminSidebar znacke={znacke} />

      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar uporabnik={uporabnik} />

        <main className="w-full flex-1 px-(--s3) py-(--s3)">
          <div className="flex flex-wrap items-end justify-between gap-(--s2)">
            <div className="min-w-0">
              <p className="type-eyebrow text-subtle">{oznaka}</p>
              <h1 className="type-h2 mt-(--s1)">{naslov}</h1>
              {opis ? (
                <p className="type-small text-muted mera mt-(--s1)">{opis}</p>
              ) : null}
            </div>
            {desno ? <div className="shrink-0">{desno}</div> : null}
          </div>

          <div className="mt-(--s3)">{children}</div>
        </main>

        <AdminFooter razlicica={razlicica ?? razlicicaStrani()} />
      </div>
    </div>
  );
}
