import { TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils/cn";

// ============================================================================
// StatCard — KANONSKA KPI kartica za vse admin strani
// ----------------------------------------------------------------------------
// Ista datoteka (API, mere, tipografske stopnje) kot na gostilnica-plus.si in
// second-home.hr. Spremeni tu, prenesi ena proti ena — administracija mora na
// vseh treh straneh izgledati enako, sicer se je je treba za vsako stranko
// učiti znova.
//
// Mere: padding `--s3`, `rounded-2xl`, višina iz vsebine. Oznaka
// `type-eyebrow` → vrednost `type-h3` (edini element s težo 700), razmik
// `--s1`. Namig na dnu z `mt-auto`, da so kartice v vrsti poravnane.
//
// Na telefonu je kartica KVADRATNA in brez delte, krivulje in namiga: ti
// povedo, kako se številka giblje, kar je vprašanje za namizje. S telefona se
// administracija ureja na hitro — takrat šteje številka sama.
// ============================================================================

type Ton = "neutral" | "success" | "warning" | "accent" | "danger" | "muted";

type Props = {
  /** Oznaka nad vrednostjo. */
  label: string;
  value: number | string | ReactNode;
  icon?: ReactNode;
  variant?: Ton;
  /** % sprememba proti prejšnjemu obdobju; `null` = ni primerjave. */
  delta?: number | null;
  /** Obrnjena semantika (nižje = boljše). */
  deltaInverse?: boolean;
  deltaLabel?: string;
  hint?: ReactNode;
  /** Utripajoča pika ob ikoni — »v živo«. */
  live?: boolean;
  href?: string;
  compact?: boolean;
  active?: boolean;
  nested?: boolean;
  className?: string;
};

const IKONA_OZADJE: Record<Ton, string> = {
  neutral: "bg-text/10 text-text",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  accent: "bg-accent/15 text-accent",
  danger: "bg-danger/15 text-danger",
  muted: "bg-text/6 text-muted",
};

/** Tisoči s tankim presledkom — tako jih piše slovenščina. */
function stevilo(n: number): string {
  return n.toLocaleString("sl-SI");
}

function DeltaZnacka({
  delta,
  obrnjeno,
  napis,
}: {
  delta: number | null;
  obrnjeno: boolean;
  napis: string;
}) {
  const nevtralno = delta === null || delta === 0;
  const gor = delta !== null && delta > 0;
  const dobro = obrnjeno ? !gor : gor;
  const Ikona = gor ? TrendingUp : TrendingDown;

  return (
    <p className="type-small text-subtle mt-(--s1) inline-flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap tabular-nums",
          nevtralno
            ? "bg-text/5 text-subtle"
            : dobro
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger",
        )}
      >
        {nevtralno ? (
          <span aria-hidden>—</span>
        ) : (
          <Ikona className="h-3 w-3" strokeWidth={2} aria-hidden />
        )}
        {delta === null ? "" : `${gor ? "+" : ""}${delta} %`}
      </span>
      <span className="max-sm:hidden">{napis}</span>
    </p>
  );
}

export function StatCard({
  label,
  value,
  icon,
  variant = "neutral",
  delta,
  deltaInverse = false,
  deltaLabel = "vs. prejšnje obdobje",
  hint,
  live = false,
  href,
  compact = false,
  active = false,
  nested = false,
  className,
}: Props) {
  const razredi = cn(
    // `min-w-0`: kartica je element mreže, ta pa se privzeto ne skrči pod
    // širino svoje vsebine — dolga vrednost bi razširila stolpec in z njim
    // stran, na telefonu v vodoravni drsnik.
    "flex h-full min-w-0 flex-col rounded-2xl p-(--s3) shadow-(--shadow-card)",
    "max-sm:aspect-square max-sm:justify-center",
    nested ? "bg-bg/60" : "bg-surface",
    href &&
      "cursor-pointer transition-all duration-(--dur-fast) hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover)",
    active && "ring-accent ring-2",
    active && !nested && "bg-accent/5",
    className,
  );

  const zIkono = !compact && icon;

  const vsebina = (
    <>
      <div
        className={cn(
          // Na telefonu ikona stoji NAD oznako: pri dveh karticah v vrsti
          // ostane vsebini okoli 119 px, krog vzame 40 in oznaka se odreže
          // sredi besede. `flex-col-reverse` obrne le prikaz — bralnik
          // zaslona bere oznako pred ikono.
          "flex items-start justify-between gap-3",
          "max-sm:flex-col-reverse max-sm:items-start max-sm:gap-2",
          zIkono && "h-10 items-center max-sm:h-auto",
        )}
      >
        <p className="type-eyebrow text-subtle line-clamp-2 text-pretty [--tracking-eyebrow:0.1em] sm:[--tracking-eyebrow:0.28em]">
          {label}
        </p>
        {zIkono ? (
          <span className="relative shrink-0">
            <span
              aria-hidden
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5",
                "max-sm:h-8 max-sm:w-8 max-sm:[&>svg]:h-4 max-sm:[&>svg]:w-4",
                IKONA_OZADJE[variant],
              )}
            >
              {icon}
            </span>
            {live ? (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 flex h-3 w-3 items-center justify-center"
              >
                <span className="bg-success absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
                <span className="bg-success ring-surface relative inline-flex h-2 w-2 rounded-full ring-2" />
              </span>
            ) : null}
          </span>
        ) : null}
      </div>

      <div className="mt-(--s1) flex items-end justify-between gap-3">
        <p className="type-lead sm:type-h3 text-text line-clamp-2 min-w-0 font-bold tabular-nums sm:truncate">
          {typeof value === "number" ? stevilo(value) : value}
        </p>
      </div>

      {delta !== undefined ? (
        <span className="max-sm:hidden">
          <DeltaZnacka delta={delta ?? null} obrnjeno={deltaInverse} napis={deltaLabel} />
        </span>
      ) : null}

      {hint ? (
        <p className="type-small text-subtle mt-auto pt-(--s1) max-sm:hidden">{hint}</p>
      ) : (
        <span aria-hidden className="mt-auto block" />
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} aria-current={active ? "true" : undefined} className={razredi}>
        {vsebina}
      </Link>
    );
  }
  return <div className={razredi}>{vsebina}</div>;
}
