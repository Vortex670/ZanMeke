import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * AdminList — `<ul>` vsakega admin seznama.
 *
 * Trinajst strani je pisalo isti `<ul className="flex flex-col gap-(--s2)">`.
 * Ko je bilo treba vrstice na telefonu razpotegniti od roba do roba, bi bilo
 * treba popraviti trinajst mest — in trinajsto bi se pozabilo.
 *
 * Na TELEFONU seznam preraste odmik odseka (`p-5` v `AdminSection`), da gredo
 * vrstice od roba do roba, sosede pa loči ČRTA namesto reže: zaobljena
 * kartica v zaobljeni kartici v zaobljenem odseku je vsebino odrinila 37 px
 * od roba zaslona — na 375 px desetino širine, porabljeno za tri robove drug
 * ob drugem.
 *
 * Od `sm` naprej ostane vse po starem: razmaknjene zaobljene kartice.
 */
/**
 * Razredi seznama kot NIZ — za sezname, ki jih riše `Stagger` (motion ovoj)
 * in ne morejo uporabiti komponente. Tako ostane ena sama definicija; brez
 * tega bi imelo pet strani svojo kopijo in prva sprememba bi jih razšla.
 */
export const ADMIN_LIST_CLASS = cn(
  "flex flex-col gap-(--s2)",
  "max-sm:-mx-5 max-sm:gap-0 max-sm:divide-y max-sm:divide-(--border)",
);

export function AdminList({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <ul className={cn(ADMIN_LIST_CLASS, className)}>{children}</ul>;
}
