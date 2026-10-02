import { Inbox, Mail, Phone } from "lucide-react";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { AdminListToolbar } from "@/components/admin/kit/AdminListToolbar";
import { AdminMetaItem } from "@/components/admin/kit/AdminMetaItem";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import type { AdminTabItem } from "@/components/admin/kit/AdminTabs";
import { CountChip } from "@/components/admin/kit/CountChip";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ZANIMANJE_NAPIS } from "@/lib/kontakt/validation";
import { sporocilaPoStanju, stejSporocila } from "@/lib/sporocila/queries";

// ============================================================================
// /admin/sporocila — povpraševanja
// ----------------------------------------------------------------------------
// Ista oblika kot seznami na gostilnica-plus.si: orodna vrstica z zavihki NAD
// kartico, odsek z naslovom in številom, vrstice z značko stanja in podatki.
//
// TELEFON JE PRVO DEJANJE in je gumb, ne besedilo. S te strani se kliče, ne
// prepisuje — to je edino dejanje, ki pri povpraševanju kaj spremeni.
//
// Če obvestilo po e-pošti ni odšlo, to pri vrstici piše. Povpraševanje se
// shrani tudi takrat, ko pošta odpove — izgubiti ga ne smeva, ker je edina
// stvar, zaradi katere stran stoji.
// ============================================================================

export const dynamic = "force-dynamic";

const CAS = new Intl.DateTimeFormat("sl-SI", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Ljubljana",
});

const STANJA = ["vsa", "nova", "v-teku", "zakljucena"] as const;
type Stanje = (typeof STANJA)[number];

const V_BAZI = {
  nova: "NOVO",
  "v-teku": "V_TEKU",
  zakljucena: "ZAKLJUCENO",
} as const;

const NAPIS = {
  NOVO: "Novo",
  V_TEKU: "V teku",
  ZAKLJUCENO: "Zaključeno",
} as const;

const TON = {
  NOVO: "accent",
  V_TEKU: "warning",
  ZAKLJUCENO: "success",
} as const;

export default async function Sporocila({
  searchParams,
}: {
  searchParams: Promise<{ stanje?: string }>;
}) {
  const { stanje: izbrano } = await searchParams;
  const stanje: Stanje = (STANJA as readonly string[]).includes(izbrano ?? "")
    ? (izbrano as Stanje)
    : "vsa";

  const [vrstice, stevila] = await Promise.all([
    sporocilaPoStanju(stanje === "vsa" ? undefined : V_BAZI[stanje]),
    stejSporocila(),
  ]);

  const zavihki: AdminTabItem[] = [
    {
      href: "/admin/sporocila",
      label: "Vsa",
      active: stanje === "vsa",
      count: stevila.skupaj,
    },
    {
      href: "/admin/sporocila?stanje=nova",
      label: "Nova",
      active: stanje === "nova",
      count: stevila.novo,
      tone: "accent",
    },
    {
      href: "/admin/sporocila?stanje=v-teku",
      label: "V teku",
      active: stanje === "v-teku",
      count: stevila.vTeku,
      tone: "warning",
    },
    {
      href: "/admin/sporocila?stanje=zakljucena",
      label: "Zaključena",
      active: stanje === "zakljucena",
      count: stevila.zakljuceno,
      tone: "success",
    },
  ];

  return (
    <AdminPage
      eyebrow="Stranke"
      title="Sporočila"
      description="Povpraševanja z obrazca. Shranijo se tudi, kadar pošta ne gre skozi."
    >
      <AdminListToolbar
        ariaLabel="Filtri povpraševanj"
        tabs={zavihki}
        tabsAriaLabel="Stanje povpraševanja"
      />

      <AdminSection
        icon={<Inbox className="h-5 w-5" aria-hidden />}
        title={stanje === "vsa" ? "Vsa povpraševanja" : "Izbrana povpraševanja"}
        description="Najnovejša zgoraj. Telefon je gumb — s te strani se kliče."
        action={
          <CountChip
            value={vrstice.length}
            className="bg-surface-2 text-muted"
            aria-live="polite"
          />
        }
      >
        {vrstice.length === 0 ? (
          <EmptyState
            compact
            icon={<Inbox className="h-6 w-6" aria-hidden />}
            title={stanje === "vsa" ? "Povpraševanj še ni." : "V tem stanju ni ničesar."}
            description="Ko kdo odda obrazec na strani Kontakt, se pojavi tu — in zvonec v glavi zazvoni."
          />
        ) : (
          <AdminList>
            {vrstice.map((s) => (
              <li key={s.id}>
                <AdminListRow as="div" tone={TON[s.stanje]}>
                  <div className="flex flex-wrap items-start justify-between gap-(--s2)">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="type-body text-text font-medium">{s.ime}</span>
                        {s.podjetje ? (
                          <span className="type-body text-muted">{s.podjetje}</span>
                        ) : null}
                        <Badge variant={TON[s.stanje]} size="sm">
                          {NAPIS[s.stanje]}
                        </Badge>
                        <Badge variant="outline" size="sm">
                          {ZANIMANJE_NAPIS[s.zanimanje]}
                        </Badge>
                        {!s.poslano ? (
                          <Badge variant="warning" size="sm">
                            obvestilo ni odšlo
                          </Badge>
                        ) : null}
                      </div>

                      <p className="type-small text-muted mera mt-1">{s.sporocilo}</p>

                      <div className="text-muted type-small mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                        <AdminMetaItem label="Prispelo" value={CAS.format(s.createdAt)} />
                        {s.epota ? (
                          <AdminMetaItem label="E-pošta" value={s.epota} lomi />
                        ) : null}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button
                        as="a"
                        href={`tel:${s.telefon.replace(/\s/g, "")}`}
                        size="sm"
                        leftIcon={<Phone className="h-4 w-4" aria-hidden />}
                      >
                        <span className="stevilke">{s.telefon}</span>
                      </Button>
                      {s.epota ? (
                        <Button
                          as="a"
                          href={`mailto:${s.epota}`}
                          variant="secondary"
                          size="sm"
                          leftIcon={<Mail className="h-4 w-4" aria-hidden />}
                        >
                          Odgovori
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </AdminListRow>
              </li>
            ))}
          </AdminList>
        )}
      </AdminSection>
    </AdminPage>
  );
}
