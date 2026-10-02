import { CalendarClock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import type { Sekcija } from "@/lib/pages/kazalo";

// ============================================================================
// <PravnaStran> — okvir za piškotke, zasebnost in pogoje uporabe
// ----------------------------------------------------------------------------
// Isti vzorec kot na zanmeke.com: glava z veliko ikono v ozadju, oznaka z
// ikono in črto, naslov, uvod in datum zadnje spremembe — nato besedilo s
// kazalom ob strani.
//
// Kazalo ni okras. Teh besedil nihče ne bere od začetka do konca; gost išče
// eno stvar (kako dolgo hranite podatke, kako se odjavim, kdo je upravljavec)
// in brez kazala jo lovi z drsnikom.
//
// Sloge besedila nosijo opisniki potomcev in ne razred `.prose`: pravno
// besedilo ima drugačen ritem od bloga — naslovi z ločilno črto, ožji stolpec,
// več zraka med odseki.
// ============================================================================

export function PravnaStran({
  nadnaslov = "Pravno",
  oznaka,
  ikona: Ikona,
  naslov,
  uvod,
  posodobljeno,
  sekcije,
  children,
}: {
  /** Kaj to je — »Pravno«. */
  nadnaslov?: string;
  /** Katera od pravnih strani — »Zasebnost«, »Piškotki«, »Pogoji«. */
  oznaka: string;
  ikona: LucideIcon;
  naslov: string;
  uvod?: string;
  /** Že oblikovan datum: »24. september 2026«. */
  posodobljeno: string;
  sekcije?: Sekcija[];
  children: ReactNode;
}) {
  const imaKazalo = Boolean(sekcije && sekcije.length > 0);

  return (
    <article>
      {/* ── Glava ── */}
      <section className="border-border/60 relative overflow-hidden border-b">
        {/* Velika ikona v ozadju: strani dá obraz, ne da bi zahtevala
            fotografijo, ki je za pravno besedilo tako ali tako ni. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
        >
          <Ikona
            className="text-text/[0.04]"
            strokeWidth={0.75}
            aria-hidden
            style={{ width: "clamp(16rem, 45vw, 32rem)", height: "auto" }}
          />
        </div>

        <div className="vsebnik relative z-10 py-(--s5)">
          <div className="mb-(--s3) inline-flex flex-col gap-2.5">
            <Ikona
              className="text-accent size-10 sm:size-12"
              strokeWidth={1.2}
              aria-hidden
            />
            <span aria-hidden className="bg-border block h-px w-12" />
            <p className="type-eyebrow text-muted inline-flex items-center gap-2">
              <span className="text-text font-semibold">{nadnaslov}</span>
              <span aria-hidden className="text-subtle">
                ·
              </span>
              <span>{oznaka}</span>
            </p>
          </div>

          <h1 className="type-display text-text max-w-3xl text-balance">{naslov}</h1>

          {uvod ? (
            <p className="type-lead text-muted mt-(--s3) max-w-2xl text-balance">
              {uvod}
            </p>
          ) : null}

          <p className="text-subtle type-small mt-(--s4) inline-flex items-center gap-2">
            <CalendarClock className="size-3.5" strokeWidth={1.8} aria-hidden />
            Zadnja sprememba: {posodobljeno}
          </p>
        </div>
      </section>

      {/* ── Besedilo in kazalo ── */}
      <div className="vsebnik py-(--s5)">
        <div
          className={
            imaKazalo
              ? "grid grid-cols-1 gap-(--s4) lg:grid-cols-12 lg:gap-(--s5)"
              : "mx-auto max-w-[68ch]"
          }
        >
          {imaKazalo ? (
            <aside className="lg:col-span-3">
              {/* Lepljivo šele na širokem zaslonu: na telefonu bi kazalo
                  zasedlo pol zaslona nad besedilom, ki naj bi ga vodilo.

                  Odmik je `s4` in NE višina glave: ta komponenta je prišla z
                  gostilnice, kjer glava ostane na vrhu. Tu leži na uvodu in
                  odide z njim, zato bi odmik zanjo pustil prazen pas. Prejšnji
                  zapis je bil `calc(var(--header-h) + 1rem)` — spremenljivke
                  `--header-h` na tej strani NI, zato je bil cel `calc`
                  neveljaven, `top` je ostal `auto` in kazalo se sploh ni
                  prijelo. Nedefinirana spremenljivka v `calc` ne javi ničesar;
                  pravilo tiho odpade. */}
              <div className="lg:top-s4 lg:sticky lg:max-h-[calc(100svh-2*var(--s4))] lg:overflow-y-auto">
                <p className="type-eyebrow text-subtle mb-(--s2)">Vsebina</p>
                <nav aria-label="Kazalo strani">
                  <ol className="flex flex-col gap-2">
                    {sekcije!.map((s, i) => (
                      <li key={s.id}>
                        <a
                          href={`#${s.id}`}
                          className="text-muted hover:text-accent group type-small inline-flex items-baseline gap-2.5 leading-snug transition-colors"
                        >
                          <span className="text-subtle group-hover:text-accent shrink-0 font-mono text-[11px] tabular-nums transition-colors">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span>{s.naslov}</span>
                        </a>
                      </li>
                    ))}
                  </ol>
                </nav>
              </div>
            </aside>
          ) : null}

          <div className={imaKazalo ? "min-w-0 lg:col-span-9" : ""}>
            <div
              className={[
                "text-text/85 type-body max-w-[68ch] leading-relaxed",
                "[&>*+*]:mt-(--s3)",
                // Naslov odseka: ločilna črta nad njim pove, da se začenja
                // nova tema — brez nje je stran ena sama siva stena.
                "[&_h2]:font-naslov [&_h2]:text-text [&_h2]:border-border/60 [&_h2]:scroll-mt-s4 [&_h2]:mt-(--s5) [&_h2]:border-t [&_h2]:pt-(--s4) [&_h2]:text-2xl [&_h2]:tracking-tight",
                "[&_h2:first-child]:mt-0 [&_h2:first-child]:border-t-0 [&_h2:first-child]:pt-0",
                "[&_h3]:text-text [&_h3]:mt-(--s4) [&_h3]:text-lg [&_h3]:font-semibold",
                "[&_strong]:text-text [&_strong]:font-semibold",
                "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a:hover]:no-underline",
                "[&_ul]:list-disc [&_ul]:pl-6 [&_ul>li+li]:mt-2",
                "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li+li]:mt-2",
                "[&_code]:bg-surface [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
                "[&_th]:text-subtle [&_th]:type-eyebrow [&_td]:border-border/60 [&_table]:w-full [&_table]:text-left [&_td]:border-t [&_td]:py-2",
              ].join(" ")}
            >
              {children}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
