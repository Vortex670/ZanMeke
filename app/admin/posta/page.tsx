import { ArrowRight, Mail, ScrollText } from "lucide-react";
import Link from "next/link";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminSection } from "@/components/admin/kit/AdminSection";
import { CountChip } from "@/components/admin/kit/CountChip";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { StatCard } from "@/components/admin/kit/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  POSTA_KATEGORIJA_NAPIS,
  POSTA_KATEGORIJE,
  POSTA_PREDLOGE,
  POSTA_PREJEMNIK_NAPIS,
} from "@/lib/posta/katalog";
import { getPostaCounts } from "@/lib/posta/queries";

// ============================================================================
// /admin/posta — katera pošta obstaja in kdaj gre ven
// ----------------------------------------------------------------------------
// Ista razdelitev kot na gostilnica-plus.si: seznam predlog po razdelkih,
// vsaka s sprožilcem v slovenščini. Vedeti moraš, KDAJ kdo to pošto dobi —
// ne, kje je v kodi.
//
// »Pripravljena« pomeni, da besedilo in oblika stojita, pošiljanja pa še ni.
// Brez te oznake bi kdo čakal pošto, ki ne bo nikoli prišla.
//
// Dnevnik poslanega je na svoji strani: tu je, kaj pošta JE, tam, kaj je
// pošta NAREDILA.
// ============================================================================

export const dynamic = "force-dynamic";

export default async function Posta() {
  const stevila = await getPostaCounts();

  const vUporabi = POSTA_PREDLOGE.filter((p) => p.stanje === "v-uporabi").length;

  return (
    <AdminPage
      eyebrow="Komunikacija"
      title="Pošta"
      description="Katera sporočila stran pošilja, komu in kdaj. Predogled pokaže, kako izgledajo v predalu."
      actions={
        <Button
          as="a"
          href="/admin/posta/dnevnik"
          variant="secondary"
          size="sm"
          leftIcon={<ScrollText className="h-4 w-4" aria-hidden />}
        >
          Dnevnik poslanega
        </Button>
      }
    >
      <section className="grid grid-cols-2 gap-(--s2) lg:grid-cols-4">
        <StatCard
          label="Predloge"
          value={POSTA_PREDLOGE.length}
          icon={<Mail strokeWidth={1.8} aria-hidden />}
          hint={`${vUporabi} v uporabi`}
        />
        <StatCard
          label="Poslano"
          value={stevila.poslana}
          icon={<ScrollText strokeWidth={1.8} aria-hidden />}
          variant={stevila.poslana > 0 ? "success" : "neutral"}
          hint="Od začetka strani"
          href="/admin/posta/dnevnik"
        />
        <StatCard
          label="Ni šlo"
          value={stevila.napaka}
          icon={<Mail strokeWidth={1.8} aria-hidden />}
          variant={stevila.napaka > 0 ? "danger" : "neutral"}
          hint={stevila.napaka > 0 ? "Poglej dnevnik" : "Nobene napake"}
          href="/admin/posta/dnevnik?stanje=napaka"
        />
        <StatCard
          label="Preskočeno"
          value={stevila.preskocena}
          icon={<Mail strokeWidth={1.8} aria-hidden />}
          hint="Brez ključa — razvoj"
        />
      </section>

      {POSTA_KATEGORIJE.map((kategorija) => {
        const predloge = POSTA_PREDLOGE.filter((p) => p.kategorija === kategorija);
        if (predloge.length === 0) return null;

        return (
          <AdminSection
            key={kategorija}
            className="mt-(--s3)"
            icon={<Mail className="h-5 w-5" aria-hidden />}
            title={POSTA_KATEGORIJA_NAPIS[kategorija]}
            description="Klik na predlogo odpre predogled, kakršnega vidi prejemnik."
            action={
              <CountChip value={predloge.length} className="bg-surface-2 text-muted" />
            }
          >
            <AdminList>
              {predloge.map((p) => (
                <AdminListRow
                  key={p.kljuc}
                  as="div"
                  tone={p.stanje === "v-uporabi" ? "success" : "neutral"}
                >
                  <div className="flex flex-wrap items-start justify-between gap-(--s2)">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/posta/${p.kljuc}`}
                          className="type-body text-text font-medium hover:underline"
                        >
                          {p.ime}
                        </Link>
                        <Badge variant={p.stanje === "v-uporabi" ? "success" : "muted"}>
                          {p.stanje === "v-uporabi" ? "V uporabi" : "Pripravljena"}
                        </Badge>
                        <Badge variant="outline">
                          {POSTA_PREJEMNIK_NAPIS[p.prejemnik]}
                        </Badge>
                      </div>

                      <p className="type-small text-muted mt-1">{p.sprozilec}</p>
                      <p className="type-micro text-subtle mt-1 font-mono">{p.izvor}</p>
                    </div>

                    <Button
                      as="a"
                      href={`/admin/posta/${p.kljuc}`}
                      variant="ghost"
                      size="sm"
                      rightIcon={<ArrowRight className="h-4 w-4" aria-hidden />}
                    >
                      Predogled
                    </Button>
                  </div>
                </AdminListRow>
              ))}
            </AdminList>
          </AdminSection>
        );
      })}
    </AdminPage>
  );
}
