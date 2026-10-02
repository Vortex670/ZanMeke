import type { Metadata } from "next";

import { zahtevajPrijavo } from "@/lib/auth/straza";

// ============================================================================
// Postavitev admina — ena straža za vse, kar je pod njo
// ----------------------------------------------------------------------------
// Straža stoji TU in ne na vsaki strani posebej: pravilo, ki ga je treba
// napisati na vsaki novi strani, nekdo nekoč pozabi. Postavitev obkroži tudi
// tisto, kar bo dodano jutri.
// ============================================================================

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await zahtevajPrijavo();
  return children;
}
