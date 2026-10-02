import { AdminBreadcrumbs } from "@/components/admin/shell/AdminBreadcrumbs";
import { AdminMobileNav } from "@/components/admin/shell/AdminMobileNav";
import { AdminUporabnikMeni } from "@/components/admin/shell/AdminUporabnikMeni";
import { Zvonec } from "@/components/admin/obvestila/Zvonec";
import Link from "next/link";
import type { ReactNode } from "react";

import type { PrijavljenUporabnik } from "@/lib/auth/seja";
import type { Obvestilo } from "@/lib/obvestila/queries";

// ============================================================================
// <AdminTopbar> — glava administracije čez vso širino
// ----------------------------------------------------------------------------
// Ista postavitev kot na gostilnica-plus.si in second-home.hr:
//
//   ┌──────────────┬───────────────────────────────────────────┐
//   │ ZANMEKE.COM  │ admin / statistike / …          🔔  Račun │
//   └──────────────┴───────────────────────────────────────────┘
//
//   • `absolute inset-x-0 top-0` — plast NAD stransko vrstico in vsebino,
//     ne vrstica v toku. Vsebina drsi POD glavo, zato ima `backdrop-blur`
//     kaj zameglíti. Vsebina in stranska vrstica imata `pt-20 sm:pt-24`
//     (= višina glave).
//   • Blok z imenom je enako širok kot stranska vrstica (`lg:w-80`) in ima
//     `border-r` — tako se bere kot njen vrh in ne kot ločen otok.
//   • Odjave tu ni: živi v meniju pri uporabniku. Gumb, ki je ves čas pod
//     prstom, se enkrat pritisne po nesreči, in to se zgodi sredi dela.
// ============================================================================

export function AdminTopbar({
  uporabnik,
  obvestila,
  mobilniPredal,
}: {
  uporabnik: PrijavljenUporabnik;
  obvestila: { neprebrana: number; seznam: Obvestilo[] };
  /** Vsebina predala na telefonu — običajno `<AdminSidebarNav />`. */
  mobilniPredal?: ReactNode;
}) {
  return (
    <header className="bg-bg/70 border-chrome-line absolute inset-x-0 top-0 z-(--z-sticky) flex items-center border-b py-4 shadow-(--shadow-chrome-inset) backdrop-blur-md sm:py-5 print:hidden">
      {/* Blok z imenom — širina stranske vrstice. */}
      <div className="border-chrome-line flex items-center gap-2 px-3 sm:gap-3 sm:px-5 lg:w-80 lg:shrink-0 lg:border-r lg:px-6">
        <AdminMobileNav openLabel="Odpri meni" closeLabel="Zapri meni">
          {mobilniPredal}
        </AdminMobileNav>

        <Link
          href="/admin"
          aria-label="Žan Meke — administracija"
          className="text-text hover:text-accent inline-flex items-center transition-colors"
        >
          <span className="type-eyebrow">
            ZANMEKE<span className="text-accent">.COM</span>
          </span>
        </Link>
      </div>

      {/* Drobtine samo na širokih zaslonih — na telefonu so v glavi strani.

          `min-w-0` tu ni okras: brez njega se `flex-1` ne sme skrčiti pod
          širino svoje vsebine in pri 375 px je desni rob glave stekel čez
          rob zaslona, odmik `px-3` pa je bil računan od škatle, ki je bila
          takrat že prevelika. */}
      <div className="flex min-w-0 flex-1 items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">
        <AdminBreadcrumbs className="hidden lg:flex" />

        <div className="ml-auto flex min-w-0 shrink items-center gap-2 sm:gap-2.5">
          <Zvonec neprebrana={obvestila.neprebrana} seznam={obvestila.seznam} />
          <AdminUporabnikMeni uporabnik={uporabnik} />
        </div>
      </div>
    </header>
  );
}
