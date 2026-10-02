import { cn } from "@/lib/utils";

// ============================================================================
// <CountChip /> — okrogla značka s številom
// ----------------------------------------------------------------------------
// Ena sama komponenta za vse števce v administraciji: zavihki, stranska
// vrstica, glave odsekov. Prej jih je vsak kraj risal po svoje in nobeden ni
// bil videti enako.
//
// Dve pasti, ki sta števko potiskali iz sredine kroga:
//   • `type-label` ima razmik ZA zadnjo črko — pri enem znaku to pomeni, da
//     je vsebina za ta razmik levo od sredine. Zato `tracking-normal`.
//   • vodoravna obroba pri eni sami števki naredi iz kroga oval. Zato je
//     enoznakovna značka fiksne velikosti in brez obrobe, daljša pa raste.
//
// Pisava je mono s tabularnimi števkami, da se značke med vrsticami ne
// premikajo, ko se število spremeni iz 9 v 10.
// ============================================================================

export function CountChip({
  value,
  className,
}: {
  /** Kar piše v krogu — število ali že skrajšano »99+«. */
  value: number | string;
  /** Barva ozadja in besedila; obliko določa komponenta. */
  className?: string;
}) {
  const zapis = String(value);

  return (
    <span
      className={cn(
        "type-label inline-flex shrink-0 items-center justify-center rounded-full leading-none tracking-normal tabular-nums",
        zapis.length === 1 ? "size-5" : "h-5 min-w-5 px-1.5",
        className,
      )}
    >
      {zapis}
    </span>
  );
}
