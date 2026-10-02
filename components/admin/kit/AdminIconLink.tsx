import type { ReactNode } from "react";

import { Button } from "@/components/ui/Button";

// ============================================================================
// <AdminIconLink> — pomožno dejanje v glavi strani, samo ikona
// ----------------------------------------------------------------------------
// Arhiv, tisk, obvestilo: dejanja, ki stojijo ob primarnem gumbu. Polna
// besedila so naslovu vzela ves prostor in ga zlomila po eno besedo na
// vrstico, zato nosita pomen `aria-label` in `title`.
//
// Gumb je VEDNO izrisan, tudi kadar ni česa storiti — takrat je onemogočen
// in `title` pove, zakaj. Skrivanje bi pomenilo, da je vsaka stran videti
// drugače glede na to, koliko je v njej vnosov, in da bi se uporabnik
// spraševal, kam je gumb izginil.
// ============================================================================

export function AdminIconLink({
  href,
  label,
  icon,
  variant = "ghost",
  newTab = false,
  disabledReason,
}: {
  href: string;
  /** Pomen gumba — za bralnik zaslona in namig ob kazalcu. */
  label: string;
  icon: ReactNode;
  variant?: "ghost" | "secondary";
  newTab?: boolean;
  /** Kadar je podan, je gumb onemogočen in to je razlog. */
  disabledReason?: string;
}) {
  if (disabledReason) {
    return (
      <Button
        variant={variant}
        size="icon-sm"
        disabled
        aria-label={`${label} — ${disabledReason}`}
        title={disabledReason}
      >
        {icon}
      </Button>
    );
  }

  return (
    <Button
      as="a"
      href={href}
      {...(newTab ? { target: "_blank" } : {})}
      variant={variant}
      size="icon-sm"
      aria-label={label}
      title={label}
    >
      {icon}
    </Button>
  );
}
