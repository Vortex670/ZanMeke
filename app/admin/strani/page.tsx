import { ExternalLink, FileText, Plus } from "lucide-react";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { AdminListToolbar } from "@/components/admin/kit/AdminListToolbar";
import { AdminMetaItem } from "@/components/admin/kit/AdminMetaItem";
import { AdminSearch } from "@/components/admin/kit/AdminSearch";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { CountChip } from "@/components/admin/kit/CountChip";
import type { AdminTabItem } from "@/components/admin/kit/AdminTabs";
import { EntityRowActions } from "@/components/admin/kit/EntityRowActions";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { deletePageAction, togglePageAction } from "@/lib/pages/actions";
import { getPageCounts, getPages } from "@/lib/pages/queries";
import { PAGE_STATUS_LABEL, pageStatusTone } from "@/lib/pages/status";
import { searchQuerySchema } from "@/lib/validation/filters";

// ============================================================================
// /admin/strani — pravna besedila in vse, kar ni jed, malica ali novica
// ----------------------------------------------------------------------------
// Tu živijo piškotki, zasebnost, pogoji uporabe in stran o gostilni. Vsaka
// pove, kje se njena povezava pokaže: v nogi, v meniju ali nikjer.
// ============================================================================

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ stanje?: string; q?: string }> };

const STANJA = ["vse", "objavljeno", "osnutki"] as const;
type Stanje = (typeof STANJA)[number];

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  timeZone: "Europe/Ljubljana",
  day: "numeric",
  month: "numeric",
  year: "numeric",
});

export default async function AdminStraniPage({ searchParams }: Props) {
  const sp = await searchParams;
  const stanje: Stanje = (STANJA as readonly string[]).includes(sp.stanje ?? "")
    ? (sp.stanje as Stanje)
    : "vse";
  const q = searchQuerySchema.parse(sp.q ?? "");

  const [strani, counts] = await Promise.all([
    getPages({
      q: q || undefined,
      status:
        stanje === "vse" ? undefined : stanje === "objavljeno" ? "PUBLISHED" : "DRAFT",
    }),
    getPageCounts(),
  ]);

  const naslov = (s: Stanje) => {
    const params = new URLSearchParams();
    if (s !== "vse") params.set("stanje", s);
    if (q) params.set("q", q);
    const qs = params.toString();
    return `/admin/strani${qs ? `?${qs}` : ""}`;
  };

  const zavihki: AdminTabItem[] = [
    { href: naslov("vse"), label: "Vse", active: stanje === "vse", count: counts.all },
    {
      href: naslov("objavljeno"),
      label: "Objavljeno",
      active: stanje === "objavljeno",
      count: counts.published,
      tone: "success",
    },
    {
      href: naslov("osnutki"),
      label: "Osnutki",
      active: stanje === "osnutki",
      count: counts.drafts,
      tone: "warning",
    },
  ];

  return (
    <AdminPage
      eyebrow="Vsebina"
      title="Strani"
      description="Piškotki, zasebnost, pogoji uporabe — in vse ostalo, kar ni jed, malica ali novica."
      backHref="/admin"
      backLabel="Pregled"
      actions={
        <Button
          as="a"
          href="/admin/strani/nova"
          variant="primary"
          size="sm"
          leftIcon={<Plus className="h-4 w-4" aria-hidden />}
        >
          Nova stran
        </Button>
      }
    >
      {/* Orodna vrstica stoji NAD kartico (standard §11.1). */}
      <AdminListToolbar
        ariaLabel="Filtri strani"
        tabs={zavihki}
        tabsAriaLabel="Stanje strani"
        search={
          <AdminSearch
            value={q}
            label="Iskanje po straneh"
            placeholder="Naslov ali spletni naslov…"
            basePath="/admin/strani"
          />
        }
      />

      <AdminSection
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="Vse strani"
        description="Vsaka stran pove, kje se njena povezava pokaže — v nogi, v meniju ali nikjer."
        action={
          <CountChip
            value={strani.length}
            className="bg-surface-2 text-muted"
            aria-live="polite"
          />
        }
      >
        {strani.length === 0 ? (
          <EmptyState
            compact
            icon={<FileText className="h-6 w-6" aria-hidden />}
            title={q ? "Nobena stran ne ustreza." : "Strani še ni."}
            description={
              q
                ? "Poskusi z drugo besedo."
                : "Začni s politiko zasebnosti, piškotki in pogoji uporabe — brez njih stran ne sme v zrak."
            }
            action={
              q ? undefined : (
                <Button
                  as="a"
                  href="/admin/strani/nova"
                  variant="primary"
                  size="sm"
                  leftIcon={<Plus className="h-4 w-4" aria-hidden />}
                >
                  Nova stran
                </Button>
              )
            }
          />
        ) : (
          <AdminList>
            {strani.map((stran) => (
              <li key={stran.id}>
                <AdminListRow as="div" tone={pageStatusTone(stran.status)}>
                  <div className="flex flex-wrap items-start justify-between gap-(--s2)">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/strani/${stran.id}`}
                          className="type-body text-text font-medium hover:underline"
                        >
                          {stran.title}
                        </Link>
                        <Badge variant={pageStatusTone(stran.status)} size="sm">
                          {PAGE_STATUS_LABEL[stran.status]}
                        </Badge>
                        {stran.showInFooter ? (
                          <Badge variant="neutral" size="sm">
                            v nogi
                          </Badge>
                        ) : null}
                        {stran.showInMenu ? (
                          <Badge variant="neutral" size="sm">
                            v meniju
                          </Badge>
                        ) : null}
                        {stran.status === "PUBLISHED" ? (
                          <Link
                            href={`/${stran.slug}`}
                            target="_blank"
                            className="text-subtle hover:text-text inline-flex items-center gap-1"
                            aria-label={`Odpri ${stran.title} na javni strani`}
                          >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                          </Link>
                        ) : null}
                      </div>

                      {/* Opisa v seznamu NI. Pri pravnih straneh je to
                          odstavek pravnega besedila (»Kateri piškotki so na
                          strani, čemu služijo in kako jih izklopiš…«), ki
                          vzame dve vrstici in ne pomaga izbrati, katero
                          stran odpreti — naslov to pove sam. Cel je v
                          obrazcu strani. */}
                      <div className="text-muted type-small mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <AdminMetaItem
                          label="Naslov"
                          value={`/${stran.slug}`}
                          mono
                          lomi
                        />
                        <AdminMetaItem
                          label="Spremenjeno"
                          value={DATUM.format(stran.updatedAt)}
                          mono
                        />
                        {/* Datuma objave NI: značka ob naslovu že pove, da
                            je stran objavljena, in »Objavljeno« bi v isti
                            vrstici pisalo drugič. Pri pravnih straneh sta
                            bila oba datuma tudi ista — stran je bila
                            objavljena in od takrat ni bila spremenjena.
                            Ostane »Spremenjeno«: to je edino, kar se med
                            letom premika. */}
                      </div>
                    </div>

                    <EntityRowActions
                      id={stran.id}
                      editHref={`/admin/strani/${stran.id}`}
                      toggle={{
                        active: stran.status === "PUBLISHED",
                        activeLabel: "Umakni",
                        inactiveLabel: "Objavi",
                        action: togglePageAction,
                        successToast: "Shranjeno.",
                      }}
                      remove={{
                        action: deletePageAction,
                        successToast: "Stran je izbrisana.",
                        confirmTitle: "Izbrišem stran?",
                        confirmDescription: `»${stran.title}« bo za vedno izbrisana, skupaj z besedilom.`,
                      }}
                    />
                  </div>
                </AdminListRow>
              </li>
            ))}
          </AdminList>
        )}
      </AdminSection>
    </AdminPage>
  );
}
