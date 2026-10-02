import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { DvofaktorForm } from "@/components/admin/varnost/DvofaktorForm";
import { GesloForm } from "@/components/admin/varnost/GesloForm";
import { IzbrisRacuna } from "@/components/admin/varnost/IzbrisRacuna";
import { SejeSeznam, type Naprava } from "@/components/admin/varnost/SejeSeznam";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { odtisTrenutneSeje } from "@/lib/auth/seja";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import { stejPreostaleKode } from "@/lib/auth/totp";
import { prisma } from "@/lib/prisma";
import { opisNaprave } from "@/lib/sled";

// ============================================================================
// /admin/varnost — vse, kar se tiče dostopa do te administracije
// ----------------------------------------------------------------------------
// Vrstni red sekcij ni naključen: geslo, dvofaktorska prijava, naprave, izbris.
// Gre od najpogostejšega k najbolj nepovratnemu — zadnje dejanje je tisto, do
// katerega moraš priti mimo vsega drugega.
//
// Ista razporeditev kot na gostilnica-plus.si; razlike so samo v imenih polj
// in v tem, da ta stran nima vlog — vsi računi so skrbniški.
// ============================================================================

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Varnost",
  robots: { index: false, follow: false },
};

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

export default async function Varnost() {
  const uporabnik = await zahtevajPrijavo();

  const [zapis, seje, odtis, preostaleKode] = await Promise.all([
    prisma.uporabnik.findUnique({
      where: { id: uporabnik.id },
      select: { totpPotrjenAt: true },
    }),
    prisma.seja.findMany({
      where: { uporabnikId: uporabnik.id, potece: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        zetonHash: true,
        naprava: true,
        ip: true,
        createdAt: true,
        potece: true,
      },
    }),
    odtisTrenutneSeje(),
    stejPreostaleKode(uporabnik.id),
  ]);

  const naprave: Naprava[] = seje.map((s) => ({
    id: s.id,
    opis: opisNaprave(s.naprava),
    ip: s.ip,
    zacetek: DATUM.format(s.createdAt),
    poteceCez: DATUM.format(s.potece),
    jeTa: Boolean(odtis) && s.zetonHash === odtis,
  }));

  return (
    <AdminPage
      eyebrow="Moj račun"
      title="Varnost"
      description="Geslo, dvofaktorska prijava, prijavljene naprave in izbris računa."
      backHref="/admin/racun"
      backLabel="Moj dostop"
      actions={
        <span className="text-muted type-small inline-flex items-center gap-2">
          <ShieldCheck className="size-4" strokeWidth={1.8} aria-hidden />
          {uporabnik.email}
        </span>
      }
    >
      <GesloForm />

      <DvofaktorForm
        stanje={{ vklopljena: Boolean(zapis?.totpPotrjenAt), preostaleKode }}
      />

      <SejeSeznam naprave={naprave} />

      <IzbrisRacuna epota={uporabnik.email} />
    </AdminPage>
  );
}
