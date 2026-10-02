import { TrendingDown, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";

import { Sparkline } from "@/components/admin/analytics/Sparkline";
import Link from "next/link";
import { cn, formatCount } from "@/lib/utils";

/**
 * StatCard — KANONSKA KPI kartica za vse admin strani (standard §8.1 + §11).
 * Ista datoteka (API, mere, tipografske stopnje) na zanmeke.com in
 * second-home.hr — spremeni tu, prenesi 1:1.
 *
 * Mere (isti na obeh projektih):
 *   - padding `--s3` (1,618 rem), `rounded-2xl`, višina iz vsebine (brez min-h)
 *   - oznaka `type-eyebrow` → vrednost `type-h3` (1,618 rem, 700 — edini
 *     element s težo 700), razmik med njima `--s1`
 *   - DeltaBadge »vs. prejšnje obdobje« (`type-small`), opcijski sparkline
 *   - hint `type-small` z `mt-auto` (vedno na dnu, kartice v vrsti so poravnane)
 *
 * Varianti postavitve:
 *   - `full` (privzeto): ikona v krogu desno zgoraj, delta, sparkline, hint
 *   - `compact`: brez ikone — oznaka, vrednost, hint (druga vrsta kazalnikov)
 *
 * `variant` je barvni ton ikone/sparkline-a (neutral / success / warning /
 * accent). `href` → kartica je Link (filter ali navigacija); `active` doda
 * accent ring. `nested` = znotraj AdminSection (recessed ozadje).
 */

// Iste vrednosti kot ton vrstice (`lib/admin/status.ts`), da se ton lahko
// spusti naravnost v `variant`, brez preslikave na klicnem mestu.
type Variant = "neutral" | "success" | "warning" | "accent" | "danger" | "muted";

type Props = {
  /** Oznaka nad vrednostjo (`type-eyebrow`). */
  label: string;
  /** Vrednost — število, kratek tekst ali ReactNode. */
  value: number | string | ReactNode;
  /** Lucide ikona (h-5 w-5). Pri `compact` se ne izriše. */
  icon?: ReactNode;
  /** Barvni ton ikone in sparkline-a. */
  variant?: Variant;
  /** % sprememba vs prejšnje obdobje; `null` = ni primerjave (nevtralen »—«). */
  delta?: number | null;
  /** Obrnjena semantika (nižje = boljše, npr. stopnja odboja). */
  deltaInverse?: boolean;
  /** Besedilo za delta pilulo (privzeto »vs. prejšnje obdobje«). */
  deltaLabel?: string;
  /** Sparkline trend desno od vrednosti. */
  trend?: readonly number[];
  /** Kratek namig na dnu kartice (`type-small`, `mt-auto`). */
  hint?: ReactNode;
  /** Utripajoča zelena pika ob ikoni (»v živo«). */
  live?: boolean;
  /** Če je podan, kartica postane Link. */
  href?: string;
  /** Kompaktna postavitev brez ikone. */
  compact?: boolean;
  /** Trenutno aktivni filter (accent ring). */
  active?: boolean;
  /** Znotraj AdminSection — recessed ozadje. */
  nested?: boolean;
  className?: string;
};

const ICON_BG: Record<Variant, string> = {
  neutral: "bg-text/10 text-text",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  accent: "bg-accent/15 text-accent",
  danger: "bg-danger/15 text-danger",
  muted: "bg-text/6 text-muted",
};

const SPARK_COLOR: Record<Variant, string> = {
  neutral: "text-muted",
  success: "text-success",
  warning: "text-warning",
  accent: "text-accent",
  danger: "text-danger",
  muted: "text-muted",
};

function DeltaBadge({
  delta,
  inverse,
  label,
}: {
  delta: number | null;
  inverse: boolean;
  label: string;
}) {
  const neutral = delta === null || delta === 0;
  const isUp = delta !== null && delta > 0;
  const isGood = inverse ? !isUp : isUp;
  const Icon = isUp ? TrendingUp : TrendingDown;
  return (
    <p className="type-small text-subtle mt-(--s1) inline-flex flex-wrap items-center gap-1.5">
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold whitespace-nowrap tabular-nums",
          neutral
            ? "bg-text/5 text-subtle"
            : isGood
              ? "bg-success/10 text-success"
              : "bg-danger/10 text-danger",
        )}
      >
        {neutral ? (
          <span aria-hidden>—</span>
        ) : (
          <Icon className="h-3 w-3" strokeWidth={2} aria-hidden />
        )}
        {delta === null ? "" : `${isUp ? "+" : ""}${delta} %`}
      </span>
      {/* »vs. prejšnje obdobje« šele od `sm`. Na telefonu sta v vrsti dve
          kartici po 119 px vsebine in ta pripis je vzel dve vrstici pod
          številko — razlago, ne podatka. Puščica in odstotek povesta isto. */}
      <span className="max-sm:hidden">{label}</span>
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
  trend,
  hint,
  live = false,
  href,
  compact = false,
  active = false,
  nested = false,
  className,
}: Props) {
  // Shadow-not-border: samo `--shadow-card`; hover dvigne kartico; aktivni
  // filter dobi `ring-2 ring-accent`. `h-full` = enaka višina v vrstici.
  const cardClasses = cn(
    // `min-w-0`: kartica je element mreže, ta pa se privzeto ne skrči pod
    // širino svoje vsebine. Brez tega dolga vrednost razširi stolpec in z njim
    // stran — na telefonu se to pokaže kot vodoravni drsnik čez vse.
    "flex h-full min-w-0 flex-col rounded-2xl p-(--s3) shadow-(--shadow-card)",
    // KVADRATNA na telefonu: brez namiga in pripisa ima kartica oznako,
    // ikono in številko — vsebine za okoli 100 px. Razmerje 1 : 1 jih v
    // dveh stolpcih poravna v mrežo namesto v stolpec neenakih višin.
    "max-sm:aspect-square max-sm:justify-center",
    nested ? "bg-bg/60" : "bg-surface",
    href &&
      "cursor-pointer transition-all duration-(--dur-fast) hover:-translate-y-0.5 hover:shadow-(--shadow-card-hover)",
    href && "",
    active && "ring-accent ring-2",
    active && !nested && "bg-accent/5",
    className,
  );

  const showIcon = !compact && icon;

  const inner = (
    <>
      {/* Glava: oznaka levo, (full) ikona v krogu desno. Pri ikoni ima
          vrstica fiksno višino h-10, da 2-vrstična oznaka ne premakne ikone. */}
      <div
        className={cn(
          // Na telefonu ikona stoji NAD oznako, ne ob njej.
          //
          // Pri dveh karticah v vrsti na 390 px ostane vsebini 119 px. Krog
          // z ikono vzame 40 od tega, oznaki torej 71 — »REZERVACIJE« pa
          // meri okoli 83 px tudi brez razmika med črkami, zato se ob ikoni
          // ne izide pri nobeni nastavitvi in beseda se odreže sredi.
          // Zložena postavitev vrne oznaki celo širino in ikono obdrži.
          //
          // `flex-col-reverse` obrne le prikaz: v HTML ostane oznaka pred
          // ikono, kar bralnik zaslona prebere v pravem vrstnem redu.
          "flex items-start justify-between gap-3",
          "max-sm:flex-col-reverse max-sm:items-start max-sm:gap-2",
          showIcon && "h-10 items-center max-sm:h-auto",
        )}
      >
        <p
          // Razmik med črkami je na telefonu manjši. `--tracking-eyebrow` je
          // 0,28em, pisava pa monospace — pri dveh karticah v vrsti na
          // 390 px to pomeni, da »REZERVACIJE« zavzame 122 px od 119
          // razpoložljivih. Pri 0,10em meri 97 px in se izide. Odrezana
          // beseda je hujša napaka od tesnejšega razmika.
          className="type-eyebrow text-subtle line-clamp-2 text-pretty [--tracking-eyebrow:0.1em] sm:[--tracking-eyebrow:0.28em]"
        >
          {label}
        </p>
        {showIcon ? (
          <span className="relative shrink-0">
            <span
              aria-hidden
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full [&>svg]:h-5 [&>svg]:w-5",
                "max-sm:h-8 max-sm:w-8 max-sm:[&>svg]:h-4 max-sm:[&>svg]:w-4",
                ICON_BG[variant],
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

      {/* Vrednost (+ opcijski sparkline). `truncate` = ena vrstica. */}
      <div className="mt-(--s1) flex items-end justify-between gap-3">
        {/* `min-w-0`: brez njega se prožni element ne skrči pod širino svoje
            vsebine in `truncate` ne naredi nič — dolga vrednost (»3 ure in 10
            minut«) razširi kartico, kartica stolpec in stolpec stran, ki na
            telefonu dobi vodoravni drsnik. */}
        {/* TELEFON: manjša stopnja in do dve vrstici. »12 h 58 min« je v
            kvadratku, širokem 163 px, v naslovni stopnji predolg in ga je
            `truncate` odrezal na »12 h 5…« — številka, ki je ni mogoče
            prebrati, je slabša od manjše številke. */}
        <p className="type-lead sm:type-h3 text-text line-clamp-2 min-w-0 font-bold tabular-nums sm:truncate">
          {typeof value === "number" ? formatCount(value) : value}
        </p>
        {/* Krivulja in delta odpadeta na telefonu. Obe povesta, kako se
            številka GIBLJE — to je vprašanje za namizje, kjer se sedi in
            primerja. S telefona se administracija ureja na hitro: takrat
            šteje številka sama. Skupaj sta jemali dve tretjini kvadratne
            kartice. */}
        {trend && trend.length > 1 ? (
          <Sparkline data={trend} className={cn(SPARK_COLOR[variant], "max-sm:hidden")} />
        ) : null}
      </div>

      {delta !== undefined ? (
        <span className="max-sm:hidden">
          <DeltaBadge delta={delta} inverse={deltaInverse} label={deltaLabel} />
        </span>
      ) : null}

      {/* Namig na dnu je na telefonu skrit: pove, KAKO razumeti številko, in
          to je stavek za namizje. Na 375 px je bil tretjina kartice. */}
      {hint ? (
        <p className="type-small text-subtle mt-auto pt-(--s1) max-sm:hidden">{hint}</p>
      ) : (
        <span aria-hidden className="mt-auto block" />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        aria-current={active ? "true" : undefined}
        className={cardClasses}
      >
        {inner}
      </Link>
    );
  }
  return <div className={cardClasses}>{inner}</div>;
}
