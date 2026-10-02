"use client";

import { Bell, Inbox } from "lucide-react";
import Link from "next/link";

import { CHROME_PILL, CHROME_PILL_ICON } from "@/components/admin/chrome";
import { Meni } from "@/components/ui/Meni";
import type { Obvestilo } from "@/lib/obvestila/queries";
import { cn } from "@/lib/utils";

// ============================================================================
// <Zvonec /> — nova povpraševanja
// ----------------------------------------------------------------------------
// Zvonec brez števila je okras. Tu nosi število NEODGOVORJENIH povpraševanj in
// pika je rdeča samo takrat, kadar jih je res kaj — prazen zvonec, ki vedno
// sveti, se neha gledati v treh dneh.
//
// V meniju so povpraševanja z ZAČETKOM BESEDILA in ne samo z imenom: po tem
// se vidi, ali gre za nekoga, ki hoče ponudbo, ali za koga, ki je zašel.
// ============================================================================

const CAS = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

export function Zvonec({
  neprebrana,
  seznam,
}: {
  neprebrana: number;
  seznam: Obvestilo[];
}) {
  return (
    <Meni
      naziv="Obvestila"
      sirina="w-80"
      sprozilec={(l) => (
        <button
          {...l}
          type="button"
          aria-label={neprebrana > 0 ? `Obvestila (${neprebrana} novih)` : "Obvestila"}
          // ISTA LUPINA kot pri uporabniku (`CHROME_PILL`, 48 px). Prej je bil
          // zvonec 40 px in uporabnik 44 — dva gumba drug ob drugem, visoka
          // vsak svoje, sta prva stvar, ki jo oko prebere kot površnost.
          className={cn(
            CHROME_PILL,
            CHROME_PILL_ICON,
            "relative",
            neprebrana > 0 && "text-text",
          )}
        >
          <Bell strokeWidth={1.8} aria-hidden />
          {neprebrana > 0 ? (
            <span className="bg-accent text-accent-fg type-micro absolute -top-1 -right-1 inline-flex min-w-5 items-center justify-center rounded-full px-1 font-semibold tabular-nums">
              {neprebrana > 9 ? "9+" : neprebrana}
            </span>
          ) : null}
        </button>
      )}
    >
      <div className="border-chrome-line flex items-center justify-between border-b px-3 py-2.5">
        <p className="type-eyebrow text-subtle">Obvestila</p>
        <Link href="/admin/sporocila" className="type-micro text-accent">
          Vsa sporočila
        </Link>
      </div>

      {seznam.length === 0 ? (
        <p className="type-small text-muted px-3 py-4">
          Nič novega. Ko kdo odda povpraševanje, se pokaže tu.
        </p>
      ) : (
        <ul className="divide-chrome-line max-h-96 divide-y overflow-y-auto">
          {seznam.map((o) => (
            <li key={o.id}>
              <Link
                href={o.pot}
                className="hover:bg-text/5 flex gap-2.5 px-3 py-2.5 transition-colors"
              >
                <Inbox
                  className="text-accent mt-0.5 size-4 shrink-0"
                  strokeWidth={1.8}
                  aria-hidden
                />
                <span className="min-w-0">
                  <span className="type-small text-text block truncate font-semibold">
                    {o.naslov}
                  </span>
                  <span className="type-micro text-muted line-clamp-2 block">
                    {o.opis}
                  </span>
                  <span className="type-micro text-subtle mt-0.5 block">
                    {CAS.format(o.kdaj)}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Meni>
  );
}
