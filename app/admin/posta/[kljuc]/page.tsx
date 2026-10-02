import { notFound } from "next/navigation";

import { AdminPage } from "@/components/admin/shell/AdminPage";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { Badge } from "@/components/ui/Badge";
import {
  najdiPredlogo,
  POSTA_KATEGORIJA_NAPIS,
  POSTA_PREJEMNIK_NAPIS,
} from "@/lib/posta/katalog";
import { predogledHtml } from "@/lib/posta/predogled";

// ============================================================================
// /admin/posta/[kljuc] — kako je pošta videti v predalu
// ----------------------------------------------------------------------------
// Predogled teče v `<iframe srcDoc>` in ne v strani: poštni HTML ima svoje
// tabele in svoje `<style>`, ki bi se v administraciji zaleteli z njenimi
// razredi — in obratno, naša tipografija bi popravila videz pošte in
// predogled bi lagal.
//
// `sandbox` brez `allow-scripts`: v pošti skript tako ali tako ni, in
// predogled naj ne more pognati ničesar.
// ============================================================================

export const dynamic = "force-dynamic";

export default async function PredogledPoste({
  params,
}: {
  params: Promise<{ kljuc: string }>;
}) {
  const { kljuc } = await params;
  const predloga = najdiPredlogo(kljuc);
  if (!predloga) notFound();

  const html = await predogledHtml(kljuc);
  if (!html) notFound();

  return (
    <AdminPage
      eyebrow={`Pošta · ${POSTA_KATEGORIJA_NAPIS[predloga.kategorija]}`}
      title={predloga.ime}
      description={predloga.sprozilec}
      backHref="/admin/posta"
      backLabel="Pošta"
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={predloga.stanje === "v-uporabi" ? "success" : "muted"}>
            {predloga.stanje === "v-uporabi" ? "V uporabi" : "Pripravljena"}
          </Badge>
          <Badge variant="outline">{POSTA_PREJEMNIK_NAPIS[predloga.prejemnik]}</Badge>
        </div>
      }
    >
      <AdminSection
        icon={<span aria-hidden>✉</span>}
        title="Zadeva"
        description="Kar prejemnik vidi v seznamu, preden odpre."
      >
        <p className="type-body font-mono">{predloga.zadeva}</p>
      </AdminSection>

      <AdminSection
        className="mt-(--s3)"
        icon={<span aria-hidden>{"{}"}</span>}
        title="Spremenljivke"
        description="Kaj se v besedilo vstavi ob pošiljanju. Spodaj so prikazane s primerom."
      >
        <ul className="grid gap-2 sm:grid-cols-2">
          {predloga.spremenljivke.map((v) => (
            <li key={v.ime} className="flex items-baseline gap-2">
              <code className="type-micro bg-text/6 rounded px-1.5 py-0.5">
                {`{${v.ime}}`}
              </code>
              <span className="type-small text-muted truncate">{v.primer}</span>
            </li>
          ))}
        </ul>
      </AdminSection>

      <section className="border-chrome-line bg-surface mt-(--s3) overflow-hidden rounded-2xl border">
        <div className="border-chrome-line flex items-center justify-between border-b px-(--s3) py-2.5">
          <p className="type-eyebrow text-subtle">Predogled</p>
          <p className="type-micro text-subtle">S primerom podatkov</p>
        </div>
        <iframe
          title={`Predogled — ${predloga.ime}`}
          srcDoc={html}
          sandbox=""
          className="h-[70svh] w-full border-0 bg-white"
        />
      </section>
    </AdminPage>
  );
}
