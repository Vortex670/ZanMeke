import "server-only";

import { redirect } from "next/navigation";

import { trenutniUporabnik, type PrijavljenUporabnik } from "@/lib/auth/seja";

// ============================================================================
// lib/auth/straza.ts — ena vrata v admin
// ----------------------------------------------------------------------------
// Straža stoji v POSTAVITVI admina in ne na vsaki strani posebej. Pravilo na
// vsaki strani je pravilo, ki ga nekdo nekoč pozabi napisati; postavitev pa
// obkroži vse, kar je pod njo, tudi tisto, kar bo dodano jutri.
// ============================================================================

export async function zahtevajPrijavo(): Promise<PrijavljenUporabnik> {
  const uporabnik = await trenutniUporabnik();
  if (!uporabnik) redirect("/prijava");
  return uporabnik;
}
