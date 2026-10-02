"use client";

import { LogOut, MonitorSmartphone } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { AdminSection } from "@/components/admin/kit/AdminSection";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { odjaviOstaleSejeAction, odjaviSejoAction } from "@/lib/varnost/actions";

// ============================================================================
// <SejeSeznam /> — katere naprave imajo odprto sejo
// ----------------------------------------------------------------------------
// Seje so v bazi in ne v podpisanem piškotku prav zato, da se jih da odjaviti.
// Brez tega seznama je ta lastnost neuporabljena: telefon, pozabljen pri
// serviserju, ostane prijavljen trideset dni.
//
// TRENUTNE SEJE NI MOGOČE ODJAVITI od tod — za to je gumb »Odjava«. Gumb, ki
// te vrže ven iz strani, na kateri si, je past in ne možnost.
// ============================================================================

export type Naprava = {
  id: string;
  opis: string;
  ip: string | null;
  zacetek: string;
  poteceCez: string;
  jeTa: boolean;
};

export function SejeSeznam({ naprave }: { naprave: Naprava[] }) {
  const [tece, dejanje] = useTransition();

  function odjavi(id: string) {
    dejanje(async () => {
      const izid = await odjaviSejoAction(id);
      if (izid.ok) toast.success(izid.message);
      else toast.error(izid.message);
    });
  }

  function odjaviOstale() {
    dejanje(async () => {
      const izid = await odjaviOstaleSejeAction();
      if (izid.ok) toast.success(izid.message);
      else toast.error(izid.message);
    });
  }

  const drugih = naprave.filter((n) => !n.jeTa).length;

  return (
    <AdminSection
      icon={<MonitorSmartphone className="h-5 w-5" aria-hidden />}
      title="Prijavljene naprave"
      description="Vsaka odprta seja je pot v administracijo. Kar ne prepoznaš, odjavi."
      action={
        drugih > 0 ? (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={tece}
            onClick={odjaviOstale}
          >
            Odjavi vse druge ({drugih})
          </Button>
        ) : null
      }
    >
      <ul className="divide-border/60 divide-y">
        {naprave.map((n) => (
          <li key={n.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="type-small text-text flex items-center gap-2 font-medium">
                {n.opis}
                {n.jeTa ? <Badge variant="success">ta naprava</Badge> : null}
              </p>
              <p className="type-eyebrow text-subtle mt-0.5">
                {n.ip ? `${n.ip} · ` : ""}prijava {n.zacetek} · poteče {n.poteceCez}
              </p>
            </div>

            {!n.jeTa ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={tece}
                onClick={() => odjavi(n.id)}
                leftIcon={<LogOut className="h-4 w-4" aria-hidden />}
              >
                Odjavi
              </Button>
            ) : null}
          </li>
        ))}
      </ul>
    </AdminSection>
  );
}
