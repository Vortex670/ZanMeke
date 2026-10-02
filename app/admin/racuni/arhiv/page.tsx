import { ArrowRight, Archive, FileDown, Folder } from "lucide-react";
import Link from "next/link";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { AdminMetaItem } from "@/components/admin/kit/AdminMetaItem";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { CountChip } from "@/components/admin/kit/CountChip";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { EntityRowActions } from "@/components/admin/kit/EntityRowActions";
import { izbrisiRacunAction } from "@/lib/racuni/actions";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getArhivLeta, getArhivMesece, getArhivRacune } from "@/lib/racuni/queries";
import { upnSklicIzpis } from "@/lib/racuni/upn";
import { zneskovno } from "@/lib/racuni/validation";

// ============================================================================
// /admin/racuni/arhiv — zaprte listine v mapah
// ----------------------------------------------------------------------------
// Pot je LETO › MESEC › listine. Ploščat seznam stotih računov je brez
// uporabe — iskati je treba po očeh. V mapah je vsak korak ena odločitev in
// nikoli več kot dvanajst možnosti.
//
// V arhivu so PLAČANE in PREKLICANE listine. Odprte ostanejo v seznamu, ker
// so delo; arhiv je zgodovina.
//
// Globina je v naslovu (`?leto=2026&mesec=10`), zato se da mapo shraniti med
// zaznamke in se gumb nazaj obnaša, kot človek pričakuje.
// ============================================================================

export const dynamic = "force-dynamic";

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "Europe/Ljubljana",
});

export default async function Arhiv({
  searchParams,
}: {
  searchParams: Promise<{ leto?: string; mesec?: string }>;
}) {
  const { leto: letoNiz, mesec: mesecNiz } = await searchParams;
  const leto = Number(letoNiz) || null;
  const mesec = Number(mesecNiz) || null;

  // ── Tretja raven: listine ───────────────────────────────────────────────
  if (leto && mesec) {
    const racuni = await getArhivRacune(leto, mesec);
    const skupaj = racuni.reduce((v, r) => v + r.znesekCentov, 0);

    return (
      <AdminPage
        eyebrow={`Arhiv · ${leto}`}
        title={new Intl.DateTimeFormat("sl-SI", {
          month: "long",
          year: "numeric",
        }).format(new Date(leto, mesec - 1, 1))}
        description={`${racuni.length} listin, skupaj ${zneskovno(skupaj)}.`}
        backHref={`/admin/racuni/arhiv?leto=${leto}`}
        backLabel={String(leto)}
      >
        <AdminSection
          icon={<Archive className="h-5 w-5" aria-hidden />}
          title="Listine tega meseca"
          description="Plačane in preklicane. Klik na številko odpre podrobnosti in predogled PDF."
          action={
            <CountChip
              value={racuni.length}
              className="bg-surface-2 text-muted"
              aria-live="polite"
            />
          }
        >
          <AdminList>
            {racuni.map((r) => (
              <li key={r.id}>
                <AdminListRow
                  as="div"
                  tone={r.stanje === "PLACAN" ? "success" : "neutral"}
                >
                  <div className="flex flex-wrap items-start justify-between gap-(--s2)">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/racuni/${r.id}`}
                          className="type-body text-text stevilke font-medium hover:underline"
                        >
                          {r.stevilka}
                        </Link>
                        {r.vrsta === "PREDRACUN" ? (
                          <Badge variant="outline" size="sm">
                            Predračun
                          </Badge>
                        ) : null}
                        <Badge
                          variant={r.stanje === "PLACAN" ? "success" : "muted"}
                          size="sm"
                        >
                          {r.stanje === "PLACAN" ? "Plačan" : "Preklican"}
                        </Badge>
                      </div>

                      <p className="type-small text-muted mt-1 line-clamp-1">
                        {r.podjetje ?? r.stranka} · {r.opis}
                      </p>

                      <div className="text-muted type-small mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <AdminMetaItem label="Izdano" value={DATUM.format(r.createdAt)} />
                        {r.placanoAt ? (
                          <AdminMetaItem
                            label="Plačano"
                            value={DATUM.format(r.placanoAt)}
                          />
                        ) : null}
                        <AdminMetaItem
                          label="Sklic"
                          value={upnSklicIzpis(r.stevilka)}
                          mono
                        />
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <p className="type-h3 font-naslov stevilke">
                        {zneskovno(r.znesekCentov, r.valuta)}
                      </p>

                      {/* Dejanja tudi v arhivu: PDF se odpre v zavihku,
                          brisanje pa je mogoče samo pri preklicanih — plačana
                          listina je dokument o prejetem denarju in ostane. */}
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          as="a"
                          href={`/admin/racuni/${r.id}/pdf`}
                          target="_blank"
                          rel="noopener"
                          variant="secondary"
                          size="sm"
                          leftIcon={<FileDown className="h-4 w-4" aria-hidden />}
                        >
                          PDF
                        </Button>
                        {/* Urejanje in brisanje nosi ista komponenta kot vsi
                            seznami na gostilnica-plus.si in second-home.hr. */}
                        <EntityRowActions
                          id={r.id}
                          editHref={`/admin/racuni/${r.id}`}
                          remove={{
                            action: izbrisiRacunAction,
                            successToast: "Listina je izbrisana.",
                            confirmTitle: "Izbrišem listino?",
                            confirmDescription:
                              r.stanje === "PLACAN"
                                ? `»${r.stevilka}« je PLAČANA listina. Po brisanju je ni več nikjer — Stripe plačilo pozna, tvoje knjigovodstvo pa ne. Dejanje je dokončno.`
                                : `»${r.stevilka}« je preklicana in bo za vedno izbrisana.`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </AdminListRow>
              </li>
            ))}
          </AdminList>
        </AdminSection>
      </AdminPage>
    );
  }

  // ── Druga raven: meseci ─────────────────────────────────────────────────
  if (leto) {
    const meseci = await getArhivMesece(leto);
    return (
      <AdminPage
        eyebrow="Arhiv"
        title={String(leto)}
        description="Izberi mesec. V mapi so listine po datumu izdaje."
        backHref="/admin/racuni/arhiv"
        backLabel="Arhiv"
      >
        <Mape
          vrstice={meseci}
          pot={(k) => `/admin/racuni/arhiv?leto=${leto}&mesec=${k}`}
        />
      </AdminPage>
    );
  }

  // ── Prva raven: leta ────────────────────────────────────────────────────
  const leta = await getArhivLeta();
  return (
    <AdminPage
      eyebrow="Finance"
      title="Arhiv"
      description="Plačane in preklicane listine po letih in mesecih."
      backHref="/admin/racuni"
      backLabel="Računi"
    >
      {leta.length === 0 ? (
        <EmptyState
          compact
          icon={<Archive className="h-6 w-6" aria-hidden />}
          title="Arhiv je prazen."
          description="Sem pride listina, ko je plačana ali preklicana. Odprte ostanejo v seznamu."
        />
      ) : (
        <Mape vrstice={leta} pot={(k) => `/admin/racuni/arhiv?leto=${k}`} />
      )}
    </AdminPage>
  );
}

/** Mreža map — ena vrsta vrstice za vse ravni, da je pot vedno videti enako. */
function Mape({
  vrstice,
  pot,
}: {
  vrstice: Array<{ kljuc: string; napis: string; stevilo: number }>;
  pot: (kljuc: string) => string;
}) {
  return (
    <ul className="grid gap-(--s2) sm:grid-cols-2 lg:grid-cols-3">
      {vrstice.map((v) => (
        <li key={v.kljuc}>
          <Link
            href={pot(v.kljuc)}
            className="border-chrome-line bg-surface hover:border-text/25 flex items-center gap-(--s2) rounded-2xl border p-(--s3) transition-colors"
          >
            <span
              aria-hidden
              className="bg-accent/12 text-accent inline-flex size-10 shrink-0 items-center justify-center rounded-full"
            >
              <Folder className="size-5" strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="type-body text-text block font-medium capitalize">
                {v.napis}
              </span>
              <span className="type-micro text-subtle block">
                {v.stevilo} {v.stevilo === 1 ? "listina" : "listin"}
              </span>
            </span>
            <ArrowRight
              className="text-subtle size-4 shrink-0"
              strokeWidth={1.8}
              aria-hidden
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
