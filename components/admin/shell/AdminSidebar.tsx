"use client";

import { Inbox, Images, LayoutDashboard, Settings, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

// ============================================================================
// Stranska vrstica administracije
// ----------------------------------------------------------------------------
// Ista postavitev kot na gostilnica-plus.si in second-home.hr: svetla ploskev
// s tanko črto na desni, znamka zgoraj, poti v SKUPINAH z drobnimi naslovi.
//
// Skupine niso okras. Pri desetih poteh brez njih človek bere seznam od vrha
// do dna vsakič znova; s tremi naslovi ve, v katero tretjino pogledati, še
// preden začne brati.
//
// Aktivna pot ima polnilo in debelo pisavo, ne obarvane črte: barva je na tej
// strani rezervirana za dejanje, ne za lego.
// ============================================================================

type Pot = { href: string; label: string; ikona: typeof Inbox; natanko?: boolean };

const SKUPINE: Array<{ naslov?: string; poti: Pot[] }> = [
  {
    poti: [{ href: "/admin", label: "Pregled", ikona: LayoutDashboard, natanko: true }],
  },
  {
    naslov: "Stranke",
    poti: [{ href: "/admin/sporocila", label: "Sporočila", ikona: Inbox }],
  },
  {
    naslov: "Vsebina",
    poti: [{ href: "/admin/mediji", label: "Mediji", ikona: Images }],
  },
  {
    naslov: "Nastavitve",
    poti: [
      { href: "/admin/racun", label: "Račun", ikona: Users },
      { href: "/admin/nastavitve", label: "Sistem", ikona: Settings },
    ],
  },
];

export function AdminSidebar({ znacke }: { znacke?: Record<string, number> }) {
  const pot = usePathname();

  const jeAktivna = (p: Pot) =>
    p.natanko ? pot === p.href : pot === p.href || pot.startsWith(`${p.href}/`);

  return (
    <aside className="bg-surface border-chrome-line hidden w-60 shrink-0 flex-col border-r sm:flex">
      <div className="border-chrome-line flex h-16 items-center border-b px-(--s2)">
        <Link href="/" className="leading-none">
          <span className="type-eyebrow text-text block">
            ZANMEKE<span className="text-accent">.COM</span>
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-(--s2) py-(--s2)">
        {SKUPINE.map((skupina, i) => (
          <div
            key={skupina.naslov ?? `skupina-${i}`}
            className={i > 0 ? "mt-(--s3)" : ""}
          >
            {skupina.naslov ? (
              <p className="type-eyebrow text-subtle px-3 pb-2">{skupina.naslov}</p>
            ) : null}

            <ul className="flex flex-col gap-0.5">
              {skupina.poti.map((p) => {
                const aktivna = jeAktivna(p);
                const znacka = znacke?.[p.href] ?? 0;
                return (
                  <li key={p.href}>
                    <Link
                      href={p.href}
                      aria-current={aktivna ? "page" : undefined}
                      className={cn(
                        "type-small flex items-center gap-2.5 rounded-lg px-3 py-2 transition-colors",
                        aktivna
                          ? "bg-text/6 text-text font-semibold"
                          : "text-muted hover:bg-text/4 hover:text-text",
                      )}
                    >
                      <p.ikona
                        className="size-4 shrink-0"
                        strokeWidth={1.8}
                        aria-hidden
                      />
                      <span className="min-w-0 truncate">{p.label}</span>
                      {znacka > 0 ? (
                        <span className="bg-accent text-accent-fg type-micro ml-auto rounded-full px-1.5 py-0.5 font-semibold tabular-nums">
                          {znacka}
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
