import { Inbox, LayoutDashboard, LogOut, Settings } from "lucide-react";
import Link from "next/link";

import { Gumb } from "@/components/ui/Gumb";
import type { PrijavljenUporabnik } from "@/lib/auth/seja";
import { odjavi } from "@/lib/prijava/actions";

// ============================================================================
// <AdminOgrodje /> — stranska vrstica, glava, vsebina
// ----------------------------------------------------------------------------
// Admin ima isto postavitev kot na drugih dveh straneh: temna stranska
// vrstica levo, drobtina in ime prijavljenega zgoraj, vsebina na papirju.
// Enaka postavitev pomeni, da se ob vsakem projektu ni treba znova učiti, kje
// je kaj — ne zame in ne zate.
//
// Odjava je obrazec in ne povezava: odjava SPREMENI stanje, povezava pa sme
// samo peljati. Brskalnik ali vtičnik, ki prednalaga povezave, bi te sicer
// lahko odjavil mimogrede.
// ============================================================================

const POTI = [
  { href: "/admin", label: "Pregled", ikona: LayoutDashboard },
  { href: "/admin/sporocila", label: "Sporočila", ikona: Inbox },
  { href: "/admin/nastavitve", label: "Nastavitve", ikona: Settings },
];

export function AdminOgrodje({
  uporabnik,
  naslov,
  opis,
  children,
}: {
  uporabnik: PrijavljenUporabnik;
  naslov: string;
  opis?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-papir min-h-svh sm:grid sm:grid-cols-[15rem_1fr]">
      <aside className="bg-obrat text-na-obratu px-s2 py-s3 flex flex-col sm:min-h-svh">
        <Link href="/" className="leading-none">
          <span className="type-label block tracking-[0.22em]">ŽAN MEKE</span>
          <span className="type-micro text-na-obratu/50 mt-1 block">ADMIN</span>
        </Link>

        <nav className="mt-s4 gap-s1 flex flex-col">
          {POTI.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="type-body text-na-obratu/70 hover:bg-na-obratu/10 hover:text-na-obratu flex items-center gap-3 rounded-[2px] px-3 py-2 transition-colors"
            >
              <p.ikona className="size-4" strokeWidth={1.8} aria-hidden />
              {p.label}
            </Link>
          ))}
        </nav>

        <div className="mt-s4 border-na-obratu/10 pt-s2 border-t sm:mt-auto">
          <p className="type-micro text-na-obratu/50">Prijavljen</p>
          <p className="type-body mt-0.5">{uporabnik.ime}</p>
          <form action={odjavi} className="mt-s2">
            <Gumb
              type="submit"
              videz="obris"
              className="border-na-obratu/25 text-na-obratu hover:border-na-obratu w-full justify-center"
            >
              <LogOut className="size-4" strokeWidth={1.8} aria-hidden />
              Odjava
            </Gumb>
          </form>
        </div>
      </aside>

      <main className="px-s2 py-s4 mx-auto w-full max-w-4xl">
        <h1 className="type-h2">{naslov}</h1>
        {opis ? <p className="type-body text-mirno mt-s1 mera">{opis}</p> : null}
        <div className="mt-s3">{children}</div>
      </main>
    </div>
  );
}
