import { Plus, Quote } from "lucide-react";

import { AdminList } from "@/components/admin/kit/AdminList";
import { AdminListRow } from "@/components/admin/kit/AdminListRow";
import { EntityRowActions } from "@/components/admin/kit/EntityRowActions";
import { AdminPage } from "@/components/admin/shell/AdminPage";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { izbrisiPriporociloAction } from "@/lib/priporocila/actions";
import { getPriporocila } from "@/lib/priporocila/queries";

// ============================================================================
// /admin/priporocila
// ----------------------------------------------------------------------------
// Edino besedilo na strani, ki ga ne napiše razvijalec. Zato je tu in ne v
// kodi: priporočilo pride po telefonu ali po e-pošti in mora biti na strani
// isti dan, ne ob naslednji objavi.
// ============================================================================

export const dynamic = "force-dynamic";

export default async function Priporocila() {
  const seznam = await getPriporocila();
  const objavljenih = seznam.filter((p) => p.objavljeno).length;

  return (
    <AdminPage
      eyebrow="Stranke"
      title="Priporočila"
      description={
        objavljenih === 0
          ? "Dokler ni objavljeno nobeno, odseka na strani ni. To je prav — prazen odsek pove, da si ga zamislil in ga nisi napolnil."
          : `Na strani jih je ${objavljenih}.`
      }
      actions={
        <Button as="a" href="/admin/priporocila/novo" leftIcon={<Plus className="h-4 w-4" />}>
          Novo priporočilo
        </Button>
      }
    >
      {seznam.length === 0 ? (
        <EmptyState
          icon={<Quote className="h-6 w-6" aria-hidden />}
          title="Še nobenega priporočila"
          description="Vprašaj stranko, kaj se je pri njej spremenilo, odkar stran dela. Ena poved zadošča — in prepriča bolj kot cela stran mojih besed."
          action={
            <Button as="a" href="/admin/priporocila/novo">
              Dodaj prvo
            </Button>
          }
        />
      ) : (
        <AdminList>
          {seznam.map((p) => (
            <AdminListRow key={p.id} tone={p.objavljeno ? "accent" : "neutral"}>
              <div className="gap-(--s2) flex items-start justify-between">
                <div className="min-w-0">
                  <div className="gap-(--s2) flex flex-wrap items-center">
                    <h3 className="type-h3 text-text">{p.ime}</h3>
                    {p.hisa ? <span className="type-small text-muted">{p.hisa}</span> : null}
                    <Badge variant={p.objavljeno ? "success" : "muted"}>
                      {p.objavljeno ? "Na strani" : "Osnutek"}
                    </Badge>
                  </div>

                  <p className="type-small text-muted mt-1 line-clamp-2">{p.besedilo}</p>
                </div>
              </div>

              <div className="mt-(--s2) flex justify-end">
                <EntityRowActions
                  id={p.id}
                  editHref={`/admin/priporocila/${p.id}`}
                  remove={{
                    action: izbrisiPriporociloAction,
                    successToast: "Priporočilo je izbrisano.",
                    confirmTitle: "Izbrišem priporočilo?",
                    confirmDescription: `Priporočilo stranke ${p.ime} bo za vedno izbrisano.`,
                  }}
                />
              </div>
            </AdminListRow>
          ))}
        </AdminList>
      )}
    </AdminPage>
  );
}
