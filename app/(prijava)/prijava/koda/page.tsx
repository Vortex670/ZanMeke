import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthKartica } from "@/components/auth/AuthKartica";
import { ObrazecKoda } from "@/components/auth/ObrazecKoda";
import { beriCakajoco } from "@/lib/auth/cakajoca";
import { trenutniUporabnik } from "@/lib/auth/seja";

// ============================================================================
// /prijava/koda — drugi korak prijave
// ----------------------------------------------------------------------------
// Sem pride samo, kdor je pravilno vpisal geslo in ima vklopljeno dvofaktorsko
// prijavo. Brez čakajočega stanja (podpisan piškotek, pet minut) tu ni kaj
// početi in stran pelje nazaj na začetek — sicer bi bila to pot do seje mimo
// gesla.
// ============================================================================

export const metadata: Metadata = {
  title: "Potrditev prijave",
  robots: { index: false, follow: false },
};

export default async function Koda({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const varnaPot = next?.startsWith("/") && !next.startsWith("//") ? next : "/admin";

  if (await trenutniUporabnik()) redirect(varnaPot);
  if (!(await beriCakajoco())) redirect("/prijava");

  return (
    <AuthKartica
      ikona={<ShieldCheck strokeWidth={1.5} aria-hidden />}
      oznaka="Administracija"
      korak="2 od 2"
      naslov="Potrditev"
      opis="Vpiši šestmestno kodo iz generatorja. Če telefona nimaš pri sebi, vpiši eno od rezervnih kod."
    >
      <ObrazecKoda next={varnaPot} />
    </AuthKartica>
  );
}
