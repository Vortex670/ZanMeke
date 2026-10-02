"use client";

import { LogOut, Settings, User } from "lucide-react";
import { useTransition } from "react";

import { CHROME_PILL } from "@/components/admin/chrome";
import { Meni, MeniLocnica, MeniVrstica } from "@/components/ui/Meni";
import type { PrijavljenUporabnik } from "@/lib/auth/seja";
import { odjavi } from "@/lib/prijava/actions";

// ============================================================================
// <AdminUporabnikMeni /> — kdo je prijavljen in kako ven
// ----------------------------------------------------------------------------
// Odjava je v meniju pri uporabniku in ne gumb v glavi. Razlog ni prostor:
// gumb »Odjava« ob vsaki strani je ves čas pod prstom, pritisne se po
// nesreči, in človek se sredi dela znajde na prijavni strani. V meniju je za
// en klik dlje — ravno toliko, kolikor mora biti dejanje, ki ga narediš
// enkrat na dan.
//
// Odjava gre skozi strežniško dejanje (`odjavi`), ker izbriše sejo v bazi.
// Povezava bi tu bila napačna: brskalniki prednalagajo povezave in ta bi se
// lahko sprožila mimogrede.
// ============================================================================

export function AdminUporabnikMeni({ uporabnik }: { uporabnik: PrijavljenUporabnik }) {
  const [vTeku, zacni] = useTransition();
  const zacetnica = uporabnik.ime.trim().charAt(0).toUpperCase() || "Ž";

  return (
    <Meni
      naziv="Račun"
      sirina="w-60"
      sprozilec={(l) => (
        <button
          {...l}
          type="button"
          // `h-12` in ne oblazinjenje: tako je enako visok kot zvonec ob
          // sebi, ne glede na to, ali je zraven napis ali ne.
          className={`${CHROME_PILL} h-12 gap-2.5 pr-4 pl-1.5`}
        >
          <span className="bg-accent text-accent-fg type-small inline-flex size-8 items-center justify-center rounded-full font-semibold">
            {zacetnica}
          </span>
          <span className="hidden text-left leading-tight sm:block">
            <span className="type-small text-text block max-w-[14rem] truncate">
              {uporabnik.email}
            </span>
            <span className="type-micro text-accent block font-semibold tracking-[0.12em]">
              ADMIN
            </span>
          </span>
        </button>
      )}
    >
      <div className="border-chrome-line border-b px-3 py-2.5 sm:hidden">
        <p className="type-small text-text truncate">{uporabnik.email}</p>
      </div>

      <MeniVrstica href="/admin/racun">
        <User aria-hidden />
        Moj račun
      </MeniVrstica>
      <MeniVrstica href="/admin/nastavitve">
        <Settings aria-hidden />
        Nastavitve
      </MeniVrstica>

      <MeniLocnica />

      <MeniVrstica
        type="button"
        disabled={vTeku}
        onClick={() => zacni(() => void odjavi())}
        className="text-danger hover:bg-danger/8 [&>svg]:text-danger"
      >
        <LogOut aria-hidden />
        {vTeku ? "Odjavljam …" : "Odjava"}
      </MeniVrstica>
    </Meni>
  );
}
