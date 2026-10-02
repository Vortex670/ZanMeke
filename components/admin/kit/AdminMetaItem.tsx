import type { AdminListRowTone } from "@/components/admin/kit/StatusRail";
import { cn } from "@/lib/utils";

// ============================================================================
// <AdminMetaItem> — par »oznaka: vrednost« v meta vrstici kartice seznama
// ----------------------------------------------------------------------------
// Drobni podatki pod naslovom vrstice (kdaj je prišlo, koliko nočitev, katero
// obdobje) so povsod isti par: male verzalke v pridušeni barvi, za njimi
// vrednost v barvi besedila. Vsak seznam je to doslej pisal po svoje —
// sporočila in gostje sta imela vsak svojo kopijo iste funkcije, oglasi pa
// golo vrstico številk brez oznak, iz katere se ni dalo prebrati, kaj je
// prikaz in kaj klik.
//
// Ton ni okras: pove, ali je podatek zaključen (plačano, odgovorjeno) ali še
// čaka. Zato sprejme isti nabor kot trak ob vrstici, vrednost pa mora priti iz
// tabele pomenov (`lib/admin/status.ts`), ne iz presoje ob klicu — enako
// pravilo kot za trak in značke (standard §11.2).
// ============================================================================

/** Pridušene različice — meta vrstica je drobna, polna barva bi jo prekričala. */
const TONE_TEXT: Record<AdminListRowTone, string> = {
  success: "text-success/70",
  warning: "text-warning/80",
  danger: "text-danger/80",
  accent: "text-accent/80",
  muted: "text-subtle/70",
  neutral: "text-subtle/70",
};

export function AdminMetaItem({
  label,
  value,
  mono = false,
  lomi = false,
  tone = "neutral",
}: {
  /** Kratka oznaka v verzalkah, brez dvopičja — to doda komponenta. */
  label: string;
  value: string;
  /** Števke poravnaj v stolpce (datumi, zneski, količine). */
  mono?: boolean;
  /**
   * Dovoli prelom ZNOTRAJ vrednosti.
   *
   * Za e-naslove in dolge oznake: »racunovodstvo.gostilnica@example.com« je
   * pri 375 px širši od cele kartice in je z `whitespace-nowrap` ušel čez
   * rob. Datumi in zneski tega ne smejo — »25. 9. 2026, 20:33« prelomljen
   * sredi ure je slabši od dveh vrstic.
   */
  lomi?: boolean;
  tone?: AdminListRowTone;
}) {
  return (
    // Prelom je dovoljen MED oznako in vrednostjo, ne znotraj njiju.
    //
    // Prej je bil `whitespace-nowrap` na ovoju, zato se »ZADNJA PRIJAVA:
    // 25. 9. 2026, 20:33« ni mogla prelomiti nikjer — okoli 298 px v
    // kartici, ki na telefonu ponuja 254, torej je datum ušel čez rob in
    // se odrezal sredi ure. Zdaj se prelomi pri presledku pred vrednostjo,
    // datum in oznaka pa ostaneta vsak v svojem kosu.
    //
    // Razmik med črkami je na telefonu manjši iz istega razloga kot pri
    // `StatCard`: verzalke v monospace pisavi pri 0,28em so široke.
    <span className="inline-flex flex-wrap items-center gap-x-1">
      <span
        className={cn(
          "type-eyebrow whitespace-nowrap [--tracking-eyebrow:0.1em] sm:[--tracking-eyebrow:0.28em]",
          TONE_TEXT[tone],
        )}
      >
        {label}:
      </span>
      <span
        className={cn(
          "text-text",
          lomi ? "min-w-0 break-all" : "whitespace-nowrap",
          mono && "tabular-nums",
        )}
      >
        {value}
      </span>
    </span>
  );
}
