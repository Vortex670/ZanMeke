import { LockKeyhole } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthKartica } from "@/components/auth/AuthKartica";
import { ObrazecPrijava } from "@/components/public/prijava/ObrazecPrijava";
import { trenutniUporabnik } from "@/lib/auth/seja";

// ============================================================================
// /prijava
// ----------------------------------------------------------------------------
// Kdor JE prijavljen, tu nima kaj iskati in gre naravnost v admin — sicer je
// videti, kot da se je seja odjavila, čeprav je živa.
//
// `next` pove, kam naj pelje po prijavi: kdor je kliknil globoko povezavo v
// admin in ni bil prijavljen, se vrne tja, od koder je prišel. Sprejmemo samo
// pot znotraj te strani, nikoli naslova s tujo domeno.
// ============================================================================

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false },
};

export default async function Prijava({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const varnaPot = next?.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  if (await trenutniUporabnik()) redirect(varnaPot);

  return (
    <AuthKartica
      ikona={<LockKeyhole strokeWidth={1.5} aria-hidden />}
      oznaka="Administracija"
      naslov="Prijava"
      opis="Vpiši e-naslov in geslo. Tu so povpraševanja z obrazca in vsebina strani."
    >
      <ObrazecPrijava next={varnaPot} />
    </AuthKartica>
  );
}
