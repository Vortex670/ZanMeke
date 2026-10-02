"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

// ============================================================================
// Drobtine
// ----------------------------------------------------------------------------
// Povedo, kje v administraciji si — in to brez korena: »Admin / Sporočila« in
// ne »Domov / Admin / Sporočila«. Koren je razviden iz tega, da si v adminu.
//
// Zadnji člen ni povezava: povezava, ki pelje tja, kjer si, je past za klik.
//
// Napisi so tu in ne v poti: iz poti bi dobil »sporocila« brez šumnikov in
// brez velike začetnice. Pot, ki je ni na seznamu, dobi svoj zadnji del —
// bolje nekaj kot prazno.
// ============================================================================

const NAPISI: Record<string, string> = {
  admin: "Admin",
  sporocila: "Sporočila",
  mediji: "Mediji",
  nastavitve: "Nastavitve",
  racun: "Račun",
};

export function AdminDrobtine() {
  const pot = usePathname();
  const deli = pot.split("/").filter(Boolean);

  return (
    <nav aria-label="Drobtine" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5">
        {deli.map((del, i) => {
          const zadnji = i === deli.length - 1;
          const href = "/" + deli.slice(0, i + 1).join("/");
          const napis = NAPISI[del] ?? del;

          return (
            <li key={href} className="flex min-w-0 items-center gap-1.5">
              {i > 0 ? (
                <ChevronRight
                  className="text-subtle size-3.5 shrink-0"
                  strokeWidth={2}
                  aria-hidden
                />
              ) : null}
              {zadnji ? (
                <span className="type-eyebrow text-text truncate" aria-current="page">
                  {napis}
                </span>
              ) : (
                <Link
                  href={href}
                  className="type-eyebrow text-subtle hover:text-text truncate transition-colors"
                >
                  {napis}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
