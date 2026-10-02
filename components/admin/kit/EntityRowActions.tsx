"use client";

import { Eye, EyeOff, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useActionForm } from "@/lib/forms/useActionForm";
import { cn } from "@/lib/utils";
import type { ActionResult } from "@/lib/actions/helpers";

/** Strežniška akcija, ki vzame ID zapisa in vrne `ActionResult`. */
type EntityAction = (id: string) => Promise<ActionResult>;

// ============================================================================
// <EntityRowActions> — skupne vrstične akcije admin seznamov.
// ----------------------------------------------------------------------------
// Hitri preklop (objavi / umakni), Uredi in Izbriši s potrditvijo. Vsaka stran
// je to pisala znova — in ponekod je manjkala potrditev, drugod toast.
//
//   • `row`    — preklop + Uredi + ikonski izbris (vrstica seznama)
//   • `detail` — samo izbris s polno oznako (glava strani za urejanje)
//
// `remove` je neobvezen: vloge, ki ne smejo brisati (`BRISE` v
// `lib/admin/vloge.ts`), dobijo isto vrstico brez koša. Skrivanje gumba ni
// zaščita — dejanje zavrne strežnik — ampak možnost, ki je nekdo ne sme, ga
// ne sme niti vabiti.
//
// Standard §4: obe akciji gresta skozi `useActionForm`, torej toast ob uspehu
// IN napaki, `pending` na gumbih, osvežitev seznama po mutaciji.
//
// Ista datoteka na second-home.hr (`components/admin/kit/EntityRowActions.tsx`);
// tam teče na `useTransition`, ker SH `useActionForm` še nima v tem sloju.
// ============================================================================

type Toggle = {
  active: boolean;
  /** Oznaka, ko je trenutno aktivno (npr. »Umakni«). */
  activeLabel: string;
  /** Oznaka, ko je trenutno neaktivno (npr. »Objavi«). */
  inactiveLabel: string;
  action: EntityAction;
  successToast: string;
};

type Remove = {
  action: EntityAction;
  successToast: string;
  confirmTitle: string;
  confirmDescription: string;
};

export function EntityRowActions({
  id,
  variant = "row",
  editHref,
  listHref,
  toggle,
  remove,
  labels = {},
  className,
}: {
  id: string;
  variant?: "row" | "detail";
  /** Povezava na urejanje (samo `row`). */
  editHref?: string;
  /** Kam po izbrisu v `detail` varianti. */
  listHref?: string;
  /** Hitri preklop; izpusti ga, kadar entiteta nima stanja objave. */
  toggle?: Toggle;
  /** Izpusti ga, kadar prijavljeni ne sme brisati. */
  remove?: Remove;
  labels?: { edit?: string; delete?: string; cancel?: string };
  /** Dodatni razredi na ovoju — npr. črta nad dejanji v nogi kartice. */
  className?: string;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleForm = useActionForm(
    toggle?.action ?? (async () => ({ ok: true as const })),
    {
      successToast: toggle?.successToast,
      refreshOnSuccess: true,
    },
  );

  const removeForm = useActionForm(
    remove?.action ?? (async () => ({ ok: true as const })),
    {
      successToast: remove?.successToast,
      refreshOnSuccess: true,
      redirectTo: variant === "detail" ? listHref : undefined,
      onSuccess: () => setConfirmOpen(false),
      onError: () => setConfirmOpen(false),
    },
  );

  const pending = toggleForm.pending || removeForm.pending;
  const editLabel = labels.edit ?? "Uredi";
  const deleteLabel = labels.delete ?? "Izbriši";

  return (
    <>
      {/* Na telefonu gredo akcije v svojo vrstico.
          Gumbi so `shrink-0`, naslov ob njih pa `min-w-0 flex-1` — na 390 px
          naslovu ostane okoli 100 px, dolgih besed (»Ponedeljek«,
          »september«) pa ni mogoče prelomiti, zato ubežijo iz okvira in
          tečejo pod gumbi. Prekrito besedilo je videti kot okvara.

          `w-full` v starševski vrstici z `flex-wrap` akcije potisne v novo
          vrstico. Velja za strani, kjer je ta komponenta NEPOSREDEN otrok
          vrstice (strani, tedenska-ponudba, novice, pasice, jedilnik); kjer
          je vmes še ovoj (malica), isto dobi ovoj sam. */}
      <div
        className={cn(
          "flex shrink-0 items-center gap-2 max-sm:w-full",
          // Vrstica seznama: gumbi ob desnem robu. Podrobna stran: en sam
          // gumb čez celo širino, ker tam stoji sam na dnu.
          // Vrstica seznama na telefonu: dejanja so NOGA kartice, ločena s
          // črto. Prej so lebdela pod podatki brez roba in vrstica je bila
          // videti kot tri stvari, ki se niso odločile, kam spadajo.
          variant === "row"
            ? "max-sm:border-border/60 max-sm:mt-(--s3) max-sm:justify-end max-sm:border-t max-sm:pt-(--s3)"
            : "max-sm:*:w-full",
          className,
        )}
      >
        {variant === "row" ? (
          <>
            {toggle ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                // Na telefonu »Skrij/Umakni« stoji LEVO, svinčnik in koš
                // ob desnem robu. Vsi trije skupaj v desnem kotu so bili
                // gruča treh enako pomembnih tarč tik ob palcu: preklop
                // objave se uporablja večkrat na dan, brisanje enkrat na
                // mesec, in ravno ta dva sta se dotikala.
                className="max-sm:mr-auto"
                disabled={pending}
                loading={toggleForm.pending}
                onClick={() => toggleForm.submit(id)}
                leftIcon={
                  toggle.active ? (
                    <EyeOff className="size-4" aria-hidden />
                  ) : (
                    <Eye className="size-4" aria-hidden />
                  )
                }
              >
                {toggle.active ? toggle.activeLabel : toggle.inactiveLabel}
              </Button>
            ) : null}

            {/* »Uredi« je na telefonu samo svinčnik.
                Ikona pove isto kot beseda, vrstica pa se skrajša za okoli
                70 px in gumbi se povsod poravnajo enako široko.

                Preklop objave to NE dobi: pomen se mu obrne in prečrtano
                oko ne pove, ali bo objavilo ali umaknilo — osebje bi
                moralo poskusiti, da izve, kaj se zgodi.

                Beseda ostane v `sr-only`, da jo bralnik zaslona prebere,
                `title` pa jo pokaže ob zadržanem kazalcu na namizju. */}
            {editHref ? (
              <Button
                as="a"
                href={editHref}
                variant="ghost"
                size="sm"
                title={editLabel}
                leftIcon={<Pencil className="size-4" aria-hidden />}
                // Na telefonu je beseda skrita, zato mora biti gumb
                // KVADRATEN — sicer dobi ob dotiku ovalno ploskev,
                // medtem ko je koš tik ob njem krog. Iste mere kot
                // `size="icon-sm"` pri košu: 44 px na dotik, 36 z miško.
                className="max-sm:size-11 max-sm:justify-center max-sm:rounded-full max-sm:p-0"
              >
                <span className="max-sm:sr-only">{editLabel}</span>
              </Button>
            ) : null}

            {remove ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-muted hover:bg-danger/10 hover:text-danger"
                aria-label={deleteLabel}
                title={deleteLabel}
                disabled={pending}
                onClick={() => setConfirmOpen(true)}
              >
                <Trash2 className="size-4" aria-hidden />
              </Button>
            ) : null}
          </>
        ) : remove ? (
          /* Brisanje v glavi podrobne strani je TIHO, ne polno rdeče.
             Poln rdeč gumb je bil na telefonu največja stvar v prvem
             zaslonu — nad obrazcem, nad vsebino, nad »Shrani«. Najbolj
             nepovratno dejanje na strani je dobilo mesto glavnega, in to
             ravno v dosegu palca.

             Zdaj je obrobljen in rdeč šele ob dotiku. Rdeča ostane tam,
             kjer odločitev res pade — v potrditvenem oknu, kjer je poln
             rdeč gumb pravi. Pravilo 60/30/10: rdeča je poudarek, ne
             privzeta barva vsakega gumba, ki briše. */
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="text-muted hover:border-danger/40 hover:bg-danger/10 hover:text-danger max-sm:w-full"
            disabled={pending}
            onClick={() => setConfirmOpen(true)}
            leftIcon={<Trash2 className="size-4" aria-hidden />}
          >
            {deleteLabel}
          </Button>
        ) : null}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={remove?.confirmTitle ?? ""}
        description={remove?.confirmDescription}
        confirmLabel={deleteLabel}
        cancelLabel={labels.cancel ?? "Prekliči"}
        tone="danger"
        pending={removeForm.pending}
        onConfirm={() => removeForm.submit(id)}
      />
    </>
  );
}
