import { ExternalLink, Eye, LayoutTemplate, Pencil } from "lucide-react";
import { notFound } from "next/navigation";

import { ADMIN_LIST_CLASS } from "@/components/admin/kit/AdminList";
import { BlokShema } from "@/components/admin/domov/BlokShema";
import { BlokVrsticaDejanja } from "@/components/admin/domov/BlokVrstica";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { CountChip } from "@/components/admin/kit/CountChip";
import { StatCard } from "@/components/admin/kit/StatCard";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { FadeIn } from "@/components/motion/fade-in";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { toneOf } from "@/lib/admin/status";
import { getBloki } from "@/lib/domov/queries";
import { jeStran, STRAN_NAPIS, STRAN_POT } from "@/lib/domov/bloki";

// ============================================================================
// /admin/domov — odseki naslovne strani
// ----------------------------------------------------------------------------
// Ista oblika kot na zanmeke.com in second-home.hr: dve ključni številki,
// gumb »Odpri domačo stran« in kartične vrstice odsekov v istem vrstnem redu
// kot na živi strani — s predogledom besedila, značko Urejeno/Privzeto in
// gumbom »Uredi odsek«.
//
// Razlika je ena in je gostilničina: odseke se da tudi PREMAKNITI in SKRITI,
// ker se domača stran skozi leto spreminja (poleti terasa, pozimi malice).
// Urejanje besedila je na svoji strani — seznam je za pregled, ne za delo.
// ============================================================================

export const dynamic = "force-dynamic";

const DATUM = new Intl.DateTimeFormat("sl-SI", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

/** »1 polje« · »2 polji« · »3 polja« · »5 polj«. */
function poljaOznaka(n: number): string {
  if (n === 0) return "brez besedil";
  if (n === 1) return "1 polje";
  if (n === 2) return "2 polji";
  if (n <= 4) return `${n} polja`;
  return `${n} polj`;
}

export default async function AdminVsebinaPage({
  params,
}: {
  params: Promise<{ stran: string }>;
}) {
  const { stran } = await params;
  if (!jeStran(stran)) notFound();

  const bloki = await getBloki(stran);
  const urejenih = bloki.filter((b) => b.updatedAt !== null).length;
  const vidnih = bloki.filter((b) => b.isVisible).length;

  return (
    <AdminPage
      eyebrow="Vsebina"
      title={STRAN_NAPIS[stran]}
      description="Odseki te strani po vrsti, kot jih vidi obiskovalec. Premakni, skrij ali popravi besedilo."
      backHref="/admin"
      backLabel="Pregled"
      actions={
        <Button
          as="a"
          href={STRAN_POT[stran]}
          target="_blank"
          variant="secondary"
          size="sm"
          leftIcon={<ExternalLink className="h-4 w-4" aria-hidden />}
        >
          Odpri stran
        </Button>
      }
    >
      <FadeIn>
        <Stagger as="div" className="grid grid-cols-2 gap-4 sm:gap-5">
          <StaggerItem className="h-full">
            <StatCard
              label="Odseki"
              value={`${vidnih} / ${bloki.length}`}
              hint="vidnih na strani"
              icon={<Eye className="h-5 w-5" aria-hidden />}
            />
          </StaggerItem>
          <StaggerItem className="h-full">
            <StatCard
              label="Urejeni"
              value={urejenih}
              hint="ostali kažejo privzeto besedilo"
              variant={urejenih > 0 ? "accent" : "neutral"}
              icon={<Pencil className="h-5 w-5" aria-hidden />}
            />
          </StaggerItem>
        </Stagger>
      </FadeIn>

      <AdminSection
        icon={<LayoutTemplate className="h-5 w-5" aria-hidden />}
        title="Odseki"
        description="Vrstni red tu je vrstni red na strani."
        action={
          <CountChip
            value={bloki.length}
            className="bg-surface-2 text-muted"
            aria-live="polite"
          />
        }
      >
        <Stagger as="ul" className={ADMIN_LIST_CLASS}>
          {bloki.map((b, i) => {
            const prvoPolje = b.def.polja[0];
            const predogled = prvoPolje ? b.data[prvoPolje.kljuc] : undefined;
            const urejen = b.updatedAt !== null;
            const href = `/admin/vsebina/${stran}/${b.def.kljuc}`;
            const uredljiv = b.def.polja.length > 0;

            return (
              <StaggerItem as="li" key={b.def.kljuc}>
                <AdminListRow
                  as="div"
                  tone={b.isVisible ? toneOf(urejen ? "done" : "waiting") : "neutral"}
                  className="flex flex-col gap-(--s2) sm:flex-row sm:items-start sm:gap-(--s3)"
                >
                  <div className="flex shrink-0 items-start gap-(--s2)">
                    <span className="text-subtle type-small hidden w-6 pt-0.5 font-mono tabular-nums sm:block">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {/* Risba postavitve — po imenu se ne vidi, ali je odsek
                        čez cel zaslon ali v treh karticah. */}
                    <BlokShema kljuc={b.def.kljuc} />
                  </div>

                  <div className="min-w-0 flex-1">
                    {uredljiv ? (
                      <Link
                        href={href}
                        className="text-text hover:text-accent type-body block truncate font-semibold transition-colors"
                      >
                        {b.def.ime}
                      </Link>
                    ) : (
                      <p className="text-text type-body font-semibold">{b.def.ime}</p>
                    )}

                    <p className="text-muted type-small mt-1">
                      {predogled || b.def.opis}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                      {b.def.obvezen ? (
                        <Badge variant="neutral" size="sm">
                          nosilni
                        </Badge>
                      ) : (
                        <Badge variant={b.isVisible ? "success" : "neutral"} size="sm">
                          {b.isVisible ? "Viden" : "Skrit"}
                        </Badge>
                      )}
                      {uredljiv ? (
                        <Badge variant={urejen ? "accent" : "neutral"} size="sm">
                          {urejen ? "Urejeno" : "Privzeto"}
                        </Badge>
                      ) : null}
                      <span className="text-subtle type-small">
                        {poljaOznaka(b.def.polja.length)}
                      </span>
                    </div>

                    {b.updatedAt ? (
                      <p className="text-subtle type-small mt-2 tabular-nums">
                        Spremenjeno: {DATUM.format(b.updatedAt)}
                      </p>
                    ) : null}
                  </div>

                  <div className="flex shrink-0 items-center gap-1 max-sm:w-full max-sm:justify-end">
                    <BlokVrsticaDejanja
                      stran={stran}
                      kljuc={b.def.kljuc}
                      isVisible={b.isVisible}
                      obvezen={Boolean(b.def.obvezen)}
                      prvi={i === 0}
                      zadnji={i === bloki.length - 1}
                    />
                    {uredljiv ? (
                      <Button
                        as="a"
                        href={href}
                        variant="ghost"
                        size="sm"
                        leftIcon={<Pencil className="h-4 w-4" aria-hidden />}
                      >
                        Uredi odsek
                      </Button>
                    ) : null}
                  </div>
                </AdminListRow>
              </StaggerItem>
            );
          })}
        </Stagger>
      </AdminSection>
    </AdminPage>
  );
}
