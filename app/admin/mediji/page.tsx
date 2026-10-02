import { Images } from "lucide-react";

import { AdminPage } from "@/components/admin/shell/AdminPage";
import { GumbPovezava } from "@/components/ui/Gumb";

// ============================================================================
// /admin/mediji — slike
// ----------------------------------------------------------------------------
// Dokler shramba (Cloudflare R2) nima ključev, nalaganja ni in stran to
// POVE. Prazna mreža brez pojasnila je slabša od ničesar: človek klikne po
// njej, misli, da je pokvarjena, in pokliče.
//
// Ko bodo ključi, pride sem nalaganje in seznam — mapa na stranko, datoteke
// po datumu, kot je urejeno na drugih dveh straneh.
// ============================================================================

export const dynamic = "force-dynamic";

export default async function Mediji() {
  const shrambaPripravljena =
    Boolean(process.env.R2_ACCESS_KEY_ID?.trim()) &&
    Boolean(process.env.R2_SECRET_ACCESS_KEY?.trim());

  return (
    <AdminPage
      eyebrow="Mediji"
      title="Slike in dokumenti"
      description="Fotografije za stran in listine strank na enem mestu."
    >
      <section className="border-chrome-line bg-surface rounded-2xl border p-(--s4) text-center">
        <span
          aria-hidden
          className="bg-text/6 text-subtle mx-auto inline-flex size-12 items-center justify-center rounded-full"
        >
          <Images className="size-5" strokeWidth={1.6} />
        </span>

        {shrambaPripravljena ? (
          <>
            <h2 className="type-h3 mt-(--s2)">
              Shramba je priklopljena, nalaganja še ni
            </h2>
            <p className="type-small text-muted mx-auto mt-(--s1) max-w-prose">
              Ključi so na mestu. Nalaganje in seznam datotek pride sem kot naslednji
              korak.
            </p>
          </>
        ) : (
          <>
            <h2 className="type-h3 mt-(--s2)">Shramba še ni priklopljena</h2>
            <p className="type-small text-muted mx-auto mt-(--s1) max-w-prose">
              Za nalaganje slik manjkata ključa za Cloudflare R2. Dokler ju ni, slike na
              strani prihajajo iz mape v projektu — stran zaradi tega dela normalno.
            </p>
            <GumbPovezava
              href="/admin/nastavitve"
              videz="obris"
              velikost="mal"
              className="mt-(--s3)"
            >
              Poglej, kaj manjka
            </GumbPovezava>
          </>
        )}
      </section>
    </AdminPage>
  );
}
