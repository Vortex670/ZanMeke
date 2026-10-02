import { Archive, BadgeEuro, Check, FileText, Plus, Send } from "lucide-react";
import Link from "next/link";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminListToolbar } from "@/components/admin/kit/AdminListToolbar";
import { EntityRowActions } from "@/components/admin/kit/EntityRowActions";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import type { AdminTabItem } from "@/components/admin/kit/AdminTabs";
import { CountChip } from "@/components/admin/kit/CountChip";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { StatCard } from "@/components/admin/kit/StatCard";
import { VrsticaRacuna } from "@/components/admin/racuni/VrsticaRacuna";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { izbrisiRacunAction } from "@/lib/racuni/actions";
import { getRacunCounts, getRacuni, stejArhiv } from "@/lib/racuni/queries";
import { zneskovno } from "@/lib/racuni/validation";
import { jeStripePripravljen, jeStripeTestni } from "@/lib/stripe/client";

// ============================================================================
// /admin/racuni — računi in plačila
// ----------------------------------------------------------------------------
// Tok je kratek: ustvariš račun, kopiraš povezavo, pošlješ. Stranka plača s
// kartico, webhook račun označi za plačanega. Nakazilo na račun označiš sam.
//
// ŠTIRI ŠTEVILKE in nič več: koliko čaka, koliko je plačano in koliko to
// skupaj nese. Zadnja je edina, zaradi katere ta stran obstaja.
// ============================================================================

export const dynamic = "force-dynamic";

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  timeZone: "Europe/Ljubljana",
});

const STANJE_NAPIS = {
  OSNUTEK: "Osnutek",
  POSLAN: "Poslan",
  PLACAN: "Plačan",
  PREKLICAN: "Preklican",
} as const;

const STANJA = ["odprte", "osnutki", "poslane"] as const;
type Stanje = (typeof STANJA)[number];

export default async function Racuni({
  searchParams,
}: {
  searchParams: Promise<{ stanje?: string }>;
}) {
  const { stanje: izbrano } = await searchParams;
  const stanje: Stanje = (STANJA as readonly string[]).includes(izbrano ?? "")
    ? (izbrano as Stanje)
    : "odprte";

  const [racuni, stevila, vArhivu] = await Promise.all([
    getRacuni(
      stanje === "osnutki" ? "OSNUTEK" : stanje === "poslane" ? "POSLAN" : undefined,
    ),
    getRacunCounts(),
    stejArhiv(),
  ]);

  const zavihki: AdminTabItem[] = [
    {
      href: "/admin/racuni",
      label: "Odprte",
      active: stanje === "odprte",
      count: stevila.osnutek + stevila.poslan,
    },
    {
      href: "/admin/racuni?stanje=osnutki",
      label: "Osnutki",
      active: stanje === "osnutki",
      count: stevila.osnutek,
    },
    {
      href: "/admin/racuni?stanje=poslane",
      label: "Poslane",
      active: stanje === "poslane",
      count: stevila.poslan,
      tone: "warning",
    },
  ];

  const placanoSkupaj = racuni
    .filter((r) => r.stanje === "PLACAN")
    .reduce((v, r) => v + r.znesekCentov, 0);
  const cakaSkupaj = racuni
    .filter((r) => r.stanje === "POSLAN")
    .reduce((v, r) => v + r.znesekCentov, 0);

  return (
    <AdminPage
      eyebrow="Finance"
      title="Računi"
      description={
        jeStripePripravljen()
          ? jeStripeTestni()
            ? "Pozor: Stripe je v preizkusnem načinu — plačila niso prava."
            : "Stranka plača po povezavi s kartico; nakazilo označiš sam."
          : "Kartično plačilo ni priklopljeno — računi delujejo, plačilne povezave pa ne."
      }
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <Button
            as="a"
            href="/admin/racuni/arhiv"
            variant="secondary"
            size="sm"
            leftIcon={<Archive className="h-4 w-4" aria-hidden />}
          >
            Arhiv{vArhivu > 0 ? ` (${vArhivu})` : ""}
          </Button>
          <Button
            as="a"
            href="/admin/racuni/nov"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" aria-hidden />}
          >
            Nova listina
          </Button>
        </div>
      }
    >
      <section className="grid grid-cols-2 gap-(--s2) lg:grid-cols-4">
        <StatCard
          label="Čaka plačilo"
          value={stevila.poslan}
          icon={<Send strokeWidth={1.8} aria-hidden />}
          variant={stevila.poslan > 0 ? "warning" : "neutral"}
          hint={cakaSkupaj > 0 ? zneskovno(cakaSkupaj) : "Nič odprtega"}
        />
        <StatCard
          label="Osnutki"
          value={stevila.osnutek}
          icon={<FileText strokeWidth={1.8} aria-hidden />}
          hint="Še niso poslani"
        />
        <StatCard
          label="Plačani"
          value={stevila.placan}
          icon={<Check strokeWidth={1.8} aria-hidden />}
          variant={stevila.placan > 0 ? "success" : "neutral"}
          hint="Od začetka strani"
        />
        <StatCard
          label="Prejeto skupaj"
          value={zneskovno(placanoSkupaj)}
          icon={<BadgeEuro strokeWidth={1.8} aria-hidden />}
          variant="accent"
          hint="Edina številka, zaradi katere ta stran stoji"
        />
      </section>

      <AdminListToolbar
        ariaLabel="Filtri listin"
        tabs={zavihki}
        tabsAriaLabel="Stanje listine"
        className="mt-(--s3)"
      />

      <AdminSection
        className="mt-(--s2)"
        icon={<FileText className="h-5 w-5" aria-hidden />}
        title="Odprte listine"
        description="Plačane in preklicane so v arhivu. Tu je to, kar še ni rešeno."
        action={
          <CountChip
            value={racuni.length}
            className="bg-surface-2 text-muted"
            aria-live="polite"
          />
        }
      >
        {racuni.length === 0 ? (
          <EmptyState
            icon={<FileText className="size-6" strokeWidth={1.6} aria-hidden />}
            title="Še ni nobenega računa"
            description="Ko se dogovoriš za delo, tu nastane račun. Stranki pošlješ povezavo, ona plača s kartico."
            action={
              <Link href="/admin/racuni/nov">
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" aria-hidden />}>
                  Nov račun
                </Button>
              </Link>
            }
          />
        ) : (
          <AdminList>
            {racuni.map((r) => (
              <AdminListRow
                key={r.id}
                as="div"
                tone={
                  r.stanje === "PLACAN"
                    ? "success"
                    : r.stanje === "POSLAN"
                      ? "warning"
                      : "neutral"
                }
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
                      <span className="type-body text-muted">
                        {r.podjetje ?? r.stranka}
                      </span>
                      {r.vrsta === "PREDRACUN" ? (
                        <Badge variant="outline">Predračun</Badge>
                      ) : null}
                      <Badge
                        variant={
                          r.stanje === "PLACAN"
                            ? "success"
                            : r.stanje === "POSLAN"
                              ? "warning"
                              : r.stanje === "PREKLICAN"
                                ? "muted"
                                : "neutral"
                        }
                      >
                        {STANJE_NAPIS[r.stanje]}
                      </Badge>
                    </div>

                    <p className="type-small text-muted mt-1 line-clamp-2">{r.opis}</p>

                    <p className="type-micro text-subtle mt-1">
                      {r.placanoAt
                        ? `Plačano ${DATUM.format(r.placanoAt)}`
                        : r.zapadlost
                          ? `Rok ${DATUM.format(r.zapadlost)}`
                          : `Izdan ${DATUM.format(r.createdAt)}`}
                    </p>
                  </div>

                  <p className="type-h3 font-naslov stevilke shrink-0">
                    {zneskovno(r.znesekCentov, r.valuta)}
                  </p>
                </div>

                <div className="mt-(--s2) flex flex-wrap items-center justify-between gap-(--s2)">
                  <VrsticaRacuna id={r.id} zeton={r.zeton} stanje={r.stanje} />

                  {/* Urejanje in brisanje nosi ista komponenta kot vsi
                      seznami na gostilnica-plus.si in second-home.hr. */}
                  <div className="ml-auto">
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
                            : r.stanje === "POSLAN"
                              ? `»${r.stevilka}« je poslana; povezava pri stranki bo nehala delati. Dejanje je dokončno.`
                              : `»${r.stevilka}« bo za vedno izbrisana.`,
                      }}
                    />
                  </div>
                </div>
              </AdminListRow>
            ))}
          </AdminList>
        )}
      </AdminSection>
    </AdminPage>
  );
}
