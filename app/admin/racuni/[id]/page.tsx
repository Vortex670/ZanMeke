import {
  Building2,
  CreditCard,
  ExternalLink,
  FileText,
  Hash,
  Mail,
  User,
} from "lucide-react";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { AdminSection } from "@/components/admin/kit/AdminSection";
import { EntityRowActions } from "@/components/admin/kit/EntityRowActions";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { VrsticaRacuna } from "@/components/admin/racuni/VrsticaRacuna";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getNastavitve, manjkaZaRacun } from "@/lib/nastavitve/queries";
import { izbrisiRacunAction } from "@/lib/racuni/actions";
import { getRacun } from "@/lib/racuni/queries";
import { upnSklicIzpis } from "@/lib/racuni/upn";
import { zneskovno } from "@/lib/racuni/validation";

// ============================================================================
// /admin/racuni/[id] — podrobnosti ene listine
// ----------------------------------------------------------------------------
// ISTA SESTAVA kot podrobnosti na gostilnica-plus.si: en stolpec, zloženi
// odseki z ikono in naslovom, v njih vrstice »oznaka → vrednost«, dejanja v
// glavi strani. Dva stolpca so se brali kot dve ločeni strani; en stolpec se
// bere od zgoraj navzdol, kakor je dokument tudi sestavljen.
//
// Vrstni red odsekov je vrstni red vprašanj: komu, koliko, kdaj, kako plača.
// ============================================================================

export const dynamic = "force-dynamic";

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/Ljubljana",
});

const STANJE_NAPIS = {
  OSNUTEK: "Osnutek",
  POSLAN: "Poslan",
  PLACAN: "Plačan",
  PREKLICAN: "Preklican",
} as const;

const STANJE_TON = {
  OSNUTEK: "neutral",
  POSLAN: "warning",
  PLACAN: "success",
  PREKLICAN: "muted",
} as const;

/** Vrstica podatka — ista oblika kot v podrobnostih na gostilnici. */
function Vrstica({
  ikona,
  oznaka,
  children,
}: {
  ikona?: ReactNode;
  oznaka: string;
  children: ReactNode;
}) {
  return (
    <div className="border-border/60 flex flex-wrap items-baseline justify-between gap-(--s2) border-b py-(--s2) last:border-b-0">
      <dt className="type-small text-muted flex items-center gap-1.5">
        {ikona}
        {oznaka}
      </dt>
      <dd className="type-body text-text min-w-0 text-right">{children}</dd>
    </div>
  );
}

export default async function PodrobnostiRacuna({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [racun, nastavitve] = await Promise.all([getRacun(id), getNastavitve()]);
  if (!racun) notFound();

  const manjka = manjkaZaRacun(nastavitve);
  const jePredracun = racun.vrsta === "PREDRACUN";
  const vrsta = jePredracun ? "Predračun" : "Račun";

  return (
    <AdminPage
      eyebrow={`Finance · ${vrsta}`}
      title={racun.podjetje ?? racun.stranka}
      description={`${racun.stevilka} · ${zneskovno(racun.znesekCentov, racun.valuta)} · ${racun.opis}`}
      backHref="/admin/racuni"
      backLabel="Računi"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <VrsticaRacuna id={racun.id} zeton={racun.zeton} stanje={racun.stanje} />
          <EntityRowActions
            id={racun.id}
            remove={{
              action: izbrisiRacunAction,
              successToast: "Listina je izbrisana.",
              confirmTitle: "Izbrišem listino?",
              confirmDescription:
                racun.stanje === "PLACAN"
                  ? `»${racun.stevilka}« je PLAČANA listina. Po brisanju je ni več nikjer — Stripe plačilo pozna, tvoje knjigovodstvo pa ne. Dejanje je dokončno.`
                  : racun.stanje === "POSLAN"
                    ? `»${racun.stevilka}« je poslana; povezava pri stranki bo nehala delati. Dejanje je dokončno.`
                    : `»${racun.stevilka}« bo za vedno izbrisana.`,
            }}
          />
        </div>
      }
    >
      {/* ── Naročnik ──────────────────────────────────────────────────── */}
      <AdminSection
        icon={<User className="h-5 w-5" aria-hidden />}
        title="Naročnik"
        description="Komur je listina izdana in kdo plača."
        action={
          <Badge variant={STANJE_TON[racun.stanje]} size="sm">
            {STANJE_NAPIS[racun.stanje]}
          </Badge>
        }
      >
        <dl className="flex flex-col">
          <Vrstica ikona={<User className="size-4" aria-hidden />} oznaka="Ime">
            {racun.stranka}
          </Vrstica>
          {racun.podjetje ? (
            <Vrstica ikona={<Building2 className="size-4" aria-hidden />} oznaka="Hiša">
              {racun.podjetje}
            </Vrstica>
          ) : null}
          <Vrstica ikona={<Mail className="size-4" aria-hidden />} oznaka="E-pošta">
            {racun.epota ? (
              <a href={`mailto:${racun.epota}`} className="hover:underline">
                {racun.epota}
              </a>
            ) : (
              <span className="text-muted">ni vpisana — povezavo pošlji po telefonu</span>
            )}
          </Vrstica>
        </dl>
      </AdminSection>

      {/* ── Listina ───────────────────────────────────────────────────── */}
      <AdminSection
        className="mt-(--s3)"
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="Listina"
        description="Kar je na PDF-ju in na plačilni strani."
      >
        <dl className="flex flex-col">
          <Vrstica oznaka="Za">{racun.opis}</Vrstica>
          <Vrstica oznaka="Znesek">
            <span className="font-naslov stevilke text-lg font-semibold">
              {zneskovno(racun.znesekCentov, racun.valuta)}
            </span>
          </Vrstica>
          <Vrstica oznaka="Izdano">{DATUM.format(racun.createdAt)}</Vrstica>
          {racun.zapadlost ? (
            <Vrstica oznaka="Rok plačila">{DATUM.format(racun.zapadlost)}</Vrstica>
          ) : null}
          {racun.placanoAt ? (
            <Vrstica oznaka="Plačano">
              <span className="text-success">{DATUM.format(racun.placanoAt)}</span>
            </Vrstica>
          ) : null}
          <Vrstica ikona={<Hash className="size-4" aria-hidden />} oznaka="Sklic">
            <span className="font-mono">{upnSklicIzpis(racun.stevilka)}</span>
          </Vrstica>
          {racun.stripePlaciloId ? (
            <Vrstica
              ikona={<CreditCard className="size-4" aria-hidden />}
              oznaka="Plačilo pri Stripu"
            >
              <span className="font-mono text-xs">{racun.stripePlaciloId}</span>
            </Vrstica>
          ) : null}
        </dl>
      </AdminSection>

      {/* ── PDF ───────────────────────────────────────────────────────── */}
      <AdminSection
        className="mt-(--s3)"
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="PDF"
        description="Odpre se v novem zavihku — tam ga tudi natisneš ali shraniš."
      >
        {manjka.length === 0 ? (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              as="a"
              href={`/admin/racuni/${racun.id}/pdf`}
              target="_blank"
              rel="noopener"
              leftIcon={<ExternalLink className="h-4 w-4" aria-hidden />}
            >
              Odpri {vrsta.toLowerCase()}
            </Button>
            <p className="type-micro text-subtle basis-full">
              {racun.placanoAt
                ? "Plačana listina je potrdilo: brez UPN kode in brez roka."
                : `Vsebuje UPN kodo za nakazilo s sklicem ${upnSklicIzpis(racun.stevilka)}.`}
            </p>
          </div>
        ) : (
          <div>
            <p className="type-body text-text">Listine še ni mogoče izdelati.</p>
            <p className="type-small text-muted mt-(--s1)">
              V nastavitvah manjka: {manjka.join(", ")}.
            </p>
            <Button
              as="a"
              href="/admin/nastavitve"
              variant="secondary"
              size="sm"
              className="mt-(--s3)"
            >
              Odpri nastavitve
            </Button>
          </div>
        )}
      </AdminSection>
    </AdminPage>
  );
}
