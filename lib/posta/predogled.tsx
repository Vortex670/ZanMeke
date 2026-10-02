import "server-only";

import { render } from "@react-email/render";
import type { ReactElement } from "react";

import GesloPonastavitev from "@/emails/GesloPonastavitev";
import PovprasevanjePotrditev from "@/emails/PovprasevanjePotrditev";
import PovprasevanjePrejeto from "@/emails/PovprasevanjePrejeto";
import OpomnikPlacila from "@/emails/OpomnikPlacila";
import PotrdiloPlacila from "@/emails/PotrdiloPlacila";
import RacunPovezava from "@/emails/RacunPovezava";
import Vabilo from "@/emails/Vabilo";

// ============================================================================
// lib/posta/predogled.tsx — kako je pošta videti, brez pošiljanja
// ----------------------------------------------------------------------------
// Vsaka predloga nosi `PreviewProps` — primer podatkov. Isti primer uporabi
// administracija, zato predogled in resnična pošta ne moreta zdrsniti
// narazen: kar se spremeni v predlogi, se vidi tu ob naslednjem izrisu.
//
// Ključi so isti kot v katalogu; brez para med njima predloga v adminu ne
// obstaja.
// ============================================================================

const PREDLOGE: Record<string, () => ReactElement> = {
  "povprasevanje-prejeto": () => (
    <PovprasevanjePrejeto {...PovprasevanjePrejeto.PreviewProps} />
  ),
  "povprasevanje-potrditev": () => (
    <PovprasevanjePotrditev {...PovprasevanjePotrditev.PreviewProps} />
  ),
  "racun-povezava": () => <RacunPovezava {...RacunPovezava.PreviewProps} />,
  vabilo: () => <Vabilo {...Vabilo.PreviewProps} />,
  "opomnik-placila": () => <OpomnikPlacila {...OpomnikPlacila.PreviewProps} />,
  "potrdilo-placila": () => <PotrdiloPlacila {...PotrdiloPlacila.PreviewProps} />,
  "geslo-ponastavitev": () => <GesloPonastavitev {...GesloPonastavitev.PreviewProps} />,
};

/** HTML predloge s primerom podatkov; `null`, kadar ključa ni. */
export async function predogledHtml(kljuc: string): Promise<string | null> {
  const narediti = PREDLOGE[kljuc];
  if (!narediti) return null;
  return render(narediti());
}

/** Golo besedilo iste predloge — za odjemalce brez HTML in za preizkus. */
export async function predogledBesedilo(kljuc: string): Promise<string | null> {
  const narediti = PREDLOGE[kljuc];
  if (!narediti) return null;
  return render(narediti(), { plainText: true });
}
