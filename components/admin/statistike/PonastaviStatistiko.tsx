"use client";

import { RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ponastaviStatistikoAction } from "@/lib/analytics/actions";

// ============================================================================
// <PonastaviStatistiko /> — izbriše vse zabeležene obiske
// ----------------------------------------------------------------------------
// Pred zagonom so v tabelah obiski tistega, ki je stran gradil: preizkusi,
// klici s strežnika, ista stran odprta desetkrat zapored. Prvi mesec prave
// statistike bi imel v sebi ves ta šum.
//
// Ni gumb za vsak dan in ni videti kot ostali: tiha obroba, ne polna
// ploskev. Brisanje je dokončno — prejšnjih obiskov ni od kod dobiti nazaj —
// zato potrditveno okno pove, kaj bo izginilo, in dejanje sme samo
// administrator (strežnik to preveri znova, skrivanje gumba ni zaščita).
// ============================================================================

export function PonastaviStatistiko() {
  const [odprto, setOdprto] = useState(false);
  const [teče, zaženi] = useTransition();

  function ponastavi() {
    zaženi(async () => {
      const izid = await ponastaviStatistikoAction();
      if (izid.ok) {
        toast.success(izid.message ?? "Statistika je ponastavljena.");
        setOdprto(false);
      } else {
        toast.error(izid.message ?? "Ponastavitev ni uspela.");
      }
    });
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOdprto(true)}
        leftIcon={<RotateCcw className="h-4 w-4" aria-hidden />}
      >
        Ponastavi
      </Button>

      <ConfirmDialog
        open={odprto}
        onOpenChange={setOdprto}
        tone="danger"
        title="Ponastavim statistiko?"
        description="Vsi zabeleženi obiski, seje in ogledi se izbrišejo za vedno. Številke začnejo teči od nič. Rezervacije, naročila in sporočila to ne zadeva."
        confirmLabel="Ponastavi"
        cancelLabel="Prekliči"
        pending={teče}
        onConfirm={ponastavi}
      />
    </>
  );
}
