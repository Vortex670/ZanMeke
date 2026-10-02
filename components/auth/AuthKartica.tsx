import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

// ============================================================================
// <AuthKartica /> — enotna kartica za vse zaslone prijave
// ----------------------------------------------------------------------------
//   ┌────────────────────────────┐
//   │          (ikona)           │  neobvezno, z lasasto črto pod njo
//   │        OZNAKA NAD          │  drobna verzalka, centrirano
//   │           Naslov           │
//   │        kratek opis         │
//   │                            │
//   │        [ obrazec ]         │
//   └────────────────────────────┘
//
// Glava je centrirana, obrazec pa ne — ta se bere od leve. Enaka kartica je na
// gostilnica-plus.si in second-home.hr; kdor pozna eno administracijo, pozna
// vse tri.
// ============================================================================

export function AuthKartica({
  oznaka,
  naslov,
  opis,
  ikona,
  korak,
  className,
  children,
}: {
  oznaka: string;
  naslov: string;
  opis?: ReactNode;
  ikona?: ReactNode;
  /** Npr. »Korak 2 od 2«. */
  korak?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "border-crta bg-ploskev relative mx-auto w-full max-w-md overflow-hidden rounded-2xl border shadow-[0_1px_0_rgba(255,255,255,0.6)_inset,0_1px_2px_rgba(15,21,19,0.04),0_12px_32px_-12px_rgba(15,21,19,0.18)]",
        className,
      )}
    >
      <div className="px-s3 py-s4 sm:px-s4">
        <div className="mb-s3 flex flex-col items-center text-center">
          {ikona ? (
            <span className="text-poudarek mb-s2 inline-flex flex-col items-center gap-2.5">
              <span className="inline-flex [&>svg]:size-8" aria-hidden>
                {ikona}
              </span>
              <span aria-hidden className="bg-crta block h-px w-12" />
            </span>
          ) : null}
          <p className="type-label text-poudarek">{oznaka}</p>
          <h1 className="type-h2 mt-s1">{naslov}</h1>
          {opis ? (
            <p className="type-body text-mirno mt-s2 max-w-sm text-pretty">{opis}</p>
          ) : null}
          {korak ? <p className="type-label text-bledo mt-s2">{korak}</p> : null}
        </div>

        {children}
      </div>
    </div>
  );
}
