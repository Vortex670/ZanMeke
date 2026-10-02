import { ADMIN_BRAND, getBuildInfo } from "@/lib/admin/brand";
import { cn } from "@/lib/utils";

// ============================================================================
// <AdminFooter> — noga admina: stanje panela, avtorstvo, okolje in verzija.
// ----------------------------------------------------------------------------
// Kar nosi ime strani, pride iz `lib/admin/brand.ts`. Komponenta je na vseh
// projektih ista. `label` premaga privzeti napis — uporabniški panel na ZM
// uporablja isto nogo z drugim napisom.
//
//   ● Admin panel · © 2026 <lastnik>        [okolje] <domena> · v0.1.0 (sha)
//
// Utripajoča pika levo pove, da panel teče; značka okolja se pokaže samo
// izven produkcije, da se predogled ne zamenja z živo stranjo.
// ============================================================================

export function AdminFooter({
  label = ADMIN_BRAND.panelLabel,
  className,
}: { label?: string; className?: string } = {}) {
  const build = getBuildInfo();
  const year = new Date().getFullYear();

  return (
    <footer
      className={cn(
        "border-chrome-line bg-bg/40 relative shrink-0 border-t shadow-(--shadow-edge-footer) backdrop-blur-sm print:hidden",
        className,
      )}
      aria-labelledby="admin-footer-heading"
    >
      <h2 id="admin-footer-heading" className="sr-only">
        {label}
      </h2>

      {/* Na telefonu ena vrstica namesto štirih.
          Noga je pripeta na dno lupine, zato vsaka njena vrstica vzame
          vsebini enako višine. V razmaknjenih verzalkah so štiri vrstice
          okoli 110 px — na 844 px visokem zaslonu z brskalnikovim okvirjem
          se to pozna pri vsaki strani, kartice spodaj pa se odrežejo.

          Odpadeta domena (piše v naslovni vrstici brskalnika) in avtorstvo.
          Ostaneta napis panela in številka izida, ki je edino, kar se tu
          res bere. */}
      <div className="type-eyebrow text-muted flex flex-wrap items-center justify-center gap-x-2 gap-y-1 px-4 py-2 text-center [--tracking-eyebrow:0.12em] sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:px-6 sm:py-4 sm:text-left sm:[--tracking-eyebrow:0.28em] lg:px-8">
        {/* Levo — utripajoča pika, napis panela, avtorstvo. */}
        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:flex-row sm:items-center sm:gap-3">
          <span className="inline-flex items-center gap-2">
            <span
              className="relative flex size-2 items-center justify-center"
              aria-hidden
            >
              <span className="bg-success absolute inline-flex size-full animate-ping rounded-full opacity-40" />
              <span className="bg-success ring-success/20 relative inline-flex size-1.5 rounded-full ring-2" />
            </span>
            <span className="text-text/80 font-medium">{label}</span>
          </span>
          <span aria-hidden className="text-muted/40 hidden sm:inline">
            ·
          </span>
          <span className="text-text/80 max-sm:hidden">
            © {year} {ADMIN_BRAND.owner}
          </span>
        </div>

        {/* Desno — okolje (samo izven produkcije), domena, verzija. */}
        <div className="inline-flex flex-wrap items-center justify-center gap-x-2 gap-y-1 sm:flex-row sm:items-center sm:gap-3">
          {build.env !== "production" ? (
            <>
              <span className="border-warning/30 bg-warning-bg text-warning type-eyebrow inline-flex border px-2 py-0.5 font-bold">
                {build.env}
              </span>
              <span aria-hidden className="text-muted/40 hidden sm:inline">
                ·
              </span>
            </>
          ) : null}
          <span className="text-text/70 max-sm:hidden">{ADMIN_BRAND.domain}</span>
          <span aria-hidden className="text-muted/40 hidden sm:inline">
            ·
          </span>
          <span className="text-text/60 font-mono tracking-normal normal-case">
            v{build.version}
            {build.commit ? ` · ${build.commit}` : ""}
          </span>
        </div>
      </div>
    </footer>
  );
}
