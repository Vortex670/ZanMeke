import type { HTMLAttributes } from "react";

import { Container } from "@/components/ui/Container";
import { cn } from "@/lib/utils";

/**
 * AdminPageShell — enoten kontejner in vertikalni ritem za vse admin strani.
 *
 * Zakaj obstaja:
 *   - Pred to komponento je vsaka admin stran sama izbirala širino
 *     (Dashboard `max-w-(--container)`, Reviews `max-w-(--container-narrow)`,
 *     Security default `Container`), pa še padding in ritmo — UI je zato
 *     izgledal neenoten (npr. Google recenzije je bilo ožje od Varnosti).
 *   - Ritem je 1:1 zanmeke `AdminPage` (sept 2026): `max-w-6xl` (= default
 *     `Container` 72rem) + `px-4 sm:px-6 lg:px-8` + `py-6 sm:py-8` +
 *     `space-y-6 sm:space-y-8`.
 *
 * Uporaba:
 *   ```tsx
 *   <AdminPageShell>
 *     <AdminPageHeader title="..." />
 *     <section>...</section>
 *     <section>...</section>
 *   </AdminPageShell>
 *   ```
 *
 * Če kdaj potrebujemo ožji fokus (npr. "details" stran), lahko sub-strani
 * omejijo širino navzno z lokalnim `max-w-*` znotraj Shell-a — temeljni
 * container ostane enak, samo vsebina se zoži. S tem je UI še vedno
 * "isti okvir", le vsebina je bližje sredini.
 */
type AdminPageShellProps = HTMLAttributes<HTMLDivElement> & {
  /**
   * Širina okvira. Privzeto 1280 px, kar je prav za bran tekst in obrazce.
   * `sirok` (1408 px) je za poglede, ki so tabela ali koledar: tam ožji okvir
   * ne pomeni miru, ampak stisnjen stolpec.
   */
  sirina?: "default" | "wide" | "full";
};

export function AdminPageShell({
  className,
  children,
  sirina = "default",
  ...props
}: AdminPageShellProps) {
  return (
    <Container
      size={sirina}
      className={cn(
        // Vertikalni ritem (zanmeke AdminPage): 24→32px navzgor/navzdol,
        // 24→32px med vrhunskimi razdelki.
        //
        // **Footer** je v `(private)/admin/layout.tsx` (pod `<main>`).
        // Tukaj ga NI — sicer bi se renderiral 2×.
        "space-y-6 py-6 sm:space-y-8 sm:py-8",
        className,
      )}
      {...props}
    >
      {/* Na telefonu in tablici drobtinice tu (v glavi zanje ni prostora). */}
      {children}
    </Container>
  );
}
