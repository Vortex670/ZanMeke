import { AlertTriangle, Check, Mail, MinusCircle } from "lucide-react";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { AdminListToolbar } from "@/components/admin/kit/AdminListToolbar";
import type { AdminTabItem } from "@/components/admin/kit/AdminTabs";
import { StatCard } from "@/components/admin/kit/StatCard";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { getPosta, getPostaCounts } from "@/lib/posta/queries";

// ============================================================================
// /admin/posta/dnevnik — je pošta res odšla
// ----------------------------------------------------------------------------
// Vsa pošta gre skozi ena vrata (`lib/posta/send.ts`) in vsak poskus se
// zapiše — tudi neuspel in tudi preskočen, ker ključa ni.
//
// Stran odgovarja na eno vprašanje, ki se vedno postavi prepozno: ali je
// stranka obvestilo res dobila. Resend ima svoj dnevnik, a do njega pride
// samo lastnik računa in samo določen čas.
//
// »Preskočena« ni napaka: tako je označena pošta iz razvoja, kjer ključa
// namenoma ni, da preizkusi ne pošiljajo prave pošte.
// ============================================================================

export const dynamic = "force-dynamic";

const CAS = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

const STANJA = ["vsa", "poslana", "napaka", "preskocena"] as const;
type Stanje = (typeof STANJA)[number];

const NAPIS: Record<Exclude<Stanje, "vsa">, "POSLANA" | "NAPAKA" | "PRESKOCENA"> = {
  poslana: "POSLANA",
  napaka: "NAPAKA",
  preskocena: "PRESKOCENA",
};

export default async function Posta({
  searchParams,
}: {
  searchParams: Promise<{ stanje?: string }>;
}) {
  const { stanje: izbrano } = await searchParams;
  const stanje: Stanje = (STANJA as readonly string[]).includes(izbrano ?? "")
    ? (izbrano as Stanje)
    : "vsa";

  const [vrstice, stevila] = await Promise.all([
    getPosta(stanje === "vsa" ? undefined : NAPIS[stanje]),
    getPostaCounts(),
  ]);

  const zavihki: AdminTabItem[] = [
    {
      href: "/admin/posta/dnevnik",
      label: "Vsa",
      active: stanje === "vsa",
      count: stevila.skupaj,
    },
    {
      href: "/admin/posta/dnevnik?stanje=poslana",
      label: "Poslana",
      active: stanje === "poslana",
      count: stevila.poslana,
      tone: "success",
    },
    {
      href: "/admin/posta/dnevnik?stanje=napaka",
      label: "Ni šlo",
      active: stanje === "napaka",
      count: stevila.napaka,
      tone: "danger",
    },
    {
      href: "/admin/posta/dnevnik?stanje=preskocena",
      label: "Preskočena",
      active: stanje === "preskocena",
      count: stevila.preskocena,
    },
  ];

  return (
    <AdminPage
      eyebrow="Pošta"
      title="Dnevnik"
      backHref="/admin/posta"
      backLabel="Pošta"
      description="Vsak poskus pošiljanja — tudi neuspel. Brez tega na vprašanje »ali je stranka dobila« ni odgovora."
    >
      <section className="grid grid-cols-2 gap-(--s2) lg:grid-cols-4">
        <StatCard
          label="Poslana"
          value={stevila.poslana}
          icon={<Check strokeWidth={1.8} aria-hidden />}
          variant={stevila.poslana > 0 ? "success" : "neutral"}
          hint="Resend je sprejel"
        />
        <StatCard
          label="Ni šlo"
          value={stevila.napaka}
          icon={<AlertTriangle strokeWidth={1.8} aria-hidden />}
          variant={stevila.napaka > 0 ? "danger" : "neutral"}
          hint={stevila.napaka > 0 ? "Poglej razlog v seznamu" : "Nobene napake"}
        />
        <StatCard
          label="Preskočena"
          value={stevila.preskocena}
          icon={<MinusCircle strokeWidth={1.8} aria-hidden />}
          hint="Brez ključa — razvoj"
        />
        <StatCard
          label="Skupaj"
          value={stevila.skupaj}
          icon={<Mail strokeWidth={1.8} aria-hidden />}
          hint="Od začetka strani"
        />
      </section>

      <AdminListToolbar
        ariaLabel="Filtri pošte"
        tabs={zavihki}
        tabsAriaLabel="Stanje pošte"
        className="mt-(--s3)"
      />

      <div className="mt-(--s2)">
        {vrstice.length === 0 ? (
          <EmptyState
            compact
            icon={<Mail className="h-6 w-6" aria-hidden />}
            title={stanje === "vsa" ? "Pošte še ni bilo." : "V tem stanju ni ničesar."}
            description="Ko stran pošlje obvestilo o povpraševanju ali povezavo za geslo, se zapiše tu."
          />
        ) : (
          <AdminList>
            {vrstice.map((v) => (
              <AdminListRow
                key={v.id}
                as="div"
                tone={
                  v.stanje === "POSLANA"
                    ? "success"
                    : v.stanje === "NAPAKA"
                      ? "danger"
                      : "neutral"
                }
              >
                <div className="flex flex-wrap items-start justify-between gap-(--s2)">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="type-body text-text font-medium">{v.zadeva}</span>
                      <Badge
                        variant={
                          v.stanje === "POSLANA"
                            ? "success"
                            : v.stanje === "NAPAKA"
                              ? "danger"
                              : "muted"
                        }
                      >
                        {v.stanje === "POSLANA"
                          ? "Poslana"
                          : v.stanje === "NAPAKA"
                            ? "Ni šlo"
                            : "Preskočena"}
                      </Badge>
                    </div>

                    <p className="type-small text-muted mt-1 truncate">{v.prejemnik}</p>

                    {v.napaka ? (
                      <p className="type-micro text-danger mt-1">{v.napaka}</p>
                    ) : null}
                  </div>

                  <div className="shrink-0 text-right">
                    <p className="type-micro text-subtle">{CAS.format(v.createdAt)}</p>
                    {v.predloga ? (
                      <p className="type-micro text-subtle font-mono">{v.predloga}</p>
                    ) : null}
                  </div>
                </div>
              </AdminListRow>
            ))}
          </AdminList>
        )}
      </div>
    </AdminPage>
  );
}
