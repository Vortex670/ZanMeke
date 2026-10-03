import { Monitor, ScrollText, Shield, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { AdminMetaItem } from "@/components/admin/kit/AdminMetaItem";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { CountChip } from "@/components/admin/kit/CountChip";
import { Badge } from "@/components/ui/Badge";
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
// Vrstni red odsekov ni naključen: geslo, dvofaktorska prijava, naprave,
// poskusi prijave, revizijska sled, izbris. Gre od najpogostejšega k najbolj
// nepovratnemu — zadnje dejanje je tisto, do katerega moraš priti mimo vsega
// drugega.
//
// POSKUSI PRIJAVE IN SLED STA TU in ne v statistikah: kdor pride na to stran,
// išče odgovor na vprašanje »je kdo poskušal vstopiti« — in tega ne gre iskati
// med obiskom strani.
//
// Ista razporeditev kot na gostilnica-plus.si; razlike so samo v imenih polj
// in v tem, da ta stran nima vlog — vsi računi so skrbniški.
// ============================================================================

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Varnost",
  robots: { index: false, follow: false },
};

const CAS = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

/** Človeški napis za vsak dogodek — oznaka v bazi je za bazo, ne za branje. */
const SLED_NAPIS: Record<string, string> = {
  PRIJAVA_USPEH: "Prijava",
  PRIJAVA_NEUSPEH: "Neuspela prijava",
  ODJAVA: "Odjava",
  GESLO_SPREMENJENO: "Geslo spremenjeno",
  GESLO_PONASTAVLJENO: "Geslo ponastavljeno",
  "2FA_VKLOPLJENA": "Dvofaktorska prijava vklopljena",
  "2FA_IZKLOPLJENA": "Dvofaktorska prijava izklopljena",
  "2FA_REZERVNE_KODE": "Izdane nove rezervne kode",
  SEJA_ODJAVLJENA: "Naprava odjavljena",
  RACUN_IZBRISAN: "Račun izbrisan",
};

/** Barvo dobijo samo dogodki, ki kaj odnesejo; ostali so mirni. */
const TON: Record<string, "danger" | "warning" | "neutral"> = {
  PRIJAVA_NEUSPEH: "warning",
  "2FA_IZKLOPLJENA": "warning",
  RACUN_IZBRISAN: "danger",
};

export default async function Varnost() {
  const uporabnik = await zahtevajPrijavo();

  const [zapis, seje, odtis, preostaleKode, poskusi, sled] = await Promise.all([
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
    // Poskusi prijave za TA e-naslov; neuspeli so vpisani brez oznake
    // uporabnika, zato iskanje po oznaki in ne po tuji ključu.
    prisma.sled.findMany({
      where: {
        dejanje: { in: ["PRIJAVA_USPEH", "PRIJAVA_NEUSPEH"] },
        oznaka: uporabnik.email,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, dejanje: true, createdAt: true, ip: true, naprava: true },
    }),
    prisma.sled.findMany({
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        dejanje: true,
        oznaka: true,
        tarca: true,
        createdAt: true,
        ip: true,
      },
    }),
  ]);

  const naprave: Naprava[] = seje.map((s) => ({
    id: s.id,
    opis: opisNaprave(s.naprava),
    ip: s.ip,
    zacetek: DATUM.format(s.createdAt),
    poteceCez: DATUM.format(s.potece),
    jeTa: Boolean(odtis) && s.zetonHash === odtis,
  }));

  const neuspeli = poskusi.filter((p) => p.dejanje === "PRIJAVA_NEUSPEH").length;

  return (
    <AdminPage
      eyebrow="Moj račun"
      title="Varnost"
      description="Geslo, dvofaktorska prijava, prijavljene naprave in izbris računa."
      backHref="/admin/racun"
      backLabel="Moj dostop"
      actions={
        <>
          <Badge variant={zapis?.totpPotrjenAt ? "success" : "warning"} size="sm">
            {zapis?.totpPotrjenAt ? "2FA vklopljena" : "2FA izklopljena"}
          </Badge>
          <span className="text-muted type-small inline-flex items-center gap-2">
            <ShieldCheck className="size-4" strokeWidth={1.8} aria-hidden />
            {uporabnik.email}
          </span>
        </>
      }
    >
      <GesloForm />

      <DvofaktorForm
        stanje={{ vklopljena: Boolean(zapis?.totpPotrjenAt), preostaleKode }}
      />

      <SejeSeznam naprave={naprave} />

      {/* ── Poskusi prijave ─────────────────────────────────────────────── */}
      <AdminSection
        icon={<Shield className="h-5 w-5" aria-hidden />}
        title="Zadnji poskusi prijave"
        description="Deset zadnjih za ta e-naslov, uspešnih in neuspešnih."
        action={
          neuspeli > 0 ? (
            <CountChip value={neuspeli} className="bg-danger/10 text-danger" />
          ) : (
            <CountChip value={poskusi.length} className="bg-surface-2 text-muted" />
          )
        }
      >
        {poskusi.length === 0 ? (
          <p className="type-small text-muted">
            Zapisov še ni — beleženje teče od vklopa revizijske sledi naprej.
          </p>
        ) : (
          <AdminList>
            {poskusi.map((p) => {
              const uspeh = p.dejanje === "PRIJAVA_USPEH";
              return (
                <AdminListRow key={p.id} as="div" tone={uspeh ? "success" : "danger"}>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={uspeh ? "success" : "danger"} size="sm">
                      {uspeh ? "Uspela" : "Neuspela"}
                    </Badge>
                    <span className="type-small text-text">
                      {CAS.format(p.createdAt)}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <AdminMetaItem label="Naslov" value={p.ip ?? "neznan"} mono />
                    <AdminMetaItem label="Naprava" value={opisNaprave(p.naprava)} />
                  </div>
                </AdminListRow>
              );
            })}
          </AdminList>
        )}
      </AdminSection>

      {/* ── Revizijska sled ─────────────────────────────────────────────── */}
      <AdminSection
        icon={<ScrollText className="h-5 w-5" aria-hidden />}
        title="Revizijska sled"
        description="Kaj se je zgodilo z dostopom — zadnjih trideset zapisov."
        action={<CountChip value={sled.length} className="bg-surface-2 text-muted" />}
      >
        {sled.length === 0 ? (
          <p className="type-small text-muted">Zapisov še ni.</p>
        ) : (
          <AdminList>
            {sled.map((d) => (
              <AdminListRow key={d.id} as="div" tone={TON[d.dejanje] ?? "neutral"}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="type-small text-text font-medium">
                    {SLED_NAPIS[d.dejanje] ?? d.dejanje}
                  </span>
                  <span className="type-eyebrow text-subtle">
                    {CAS.format(d.createdAt)}
                  </span>
                </div>
                {d.oznaka || d.ip ? (
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    {d.oznaka ? <AdminMetaItem label="Kdo" value={d.oznaka} /> : null}
                    {d.ip ? <AdminMetaItem label="Naslov" value={d.ip} mono /> : null}
                  </div>
                ) : null}
              </AdminListRow>
            ))}
          </AdminList>
        )}
      </AdminSection>

      <IzbrisRacuna epota={uporabnik.email} />
    </AdminPage>
  );
}
