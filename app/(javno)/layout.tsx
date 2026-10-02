import { Glava } from "@/components/layout/Glava";
import { Noga } from "@/components/layout/Noga";

// ============================================================================
// Postavitev JAVNIH strani
// ----------------------------------------------------------------------------
// Glava s telefonsko številko in noga sta tu in ne v korenski postavitvi:
// na prijavni strani in v adminu nimata kaj iskati. Kdor se prijavlja, ne
// potrebuje gumba »Pokliči« — ta je zanj, ne od njega.
// ============================================================================

export default function JavnaPostavitev({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Glava />
      <main className="flex-1">{children}</main>
      <Noga />
    </>
  );
}
