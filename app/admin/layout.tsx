import type { Metadata } from "next";

import { AdminFooter } from "@/components/admin/shell/AdminFooter";
import { AdminScrollTop } from "@/components/admin/shell/AdminScrollTop";
import { AdminSidebar, AdminSidebarNav } from "@/components/admin/shell/AdminSidebar";
import { AdminTopbar } from "@/components/admin/shell/AdminTopbar";
import { BreadcrumbProvider } from "@/components/admin/shell/BreadcrumbContext";
import { zahtevajPrijavo } from "@/lib/auth/straza";
import type { AdminSidebarBadges } from "@/lib/admin/nav";
import { obvestila } from "@/lib/obvestila/queries";
import { stejSporocila } from "@/lib/sporocila/queries";

// ============================================================================
// Okvir administracije
// ----------------------------------------------------------------------------
// Straža stoji TU in ne na vsaki strani posebej: pravilo, ki ga je treba
// napisati na vsaki novi strani, nekdo nekoč pozabi. Okvir obkroži tudi
// tisto, kar bo dodano jutri.
//
// POSTAVITEV JE ENAKA kot na gostilnica-plus.si in second-home.hr: stranska
// vrstica levo, glava kot plavajoča plast čez oba stolpca in noga pod
// vsebino. `fixed inset-0` zaklene okvir na vidno polje, da se pomika samo
// vsebina — brez tega se ob dolgem seznamu premakne tudi stranska vrstica in
// meni odplava z zaslona.
//
// Značke in obvestila se berejo TU, enkrat za vse strani. Prej jih je vsaka
// stran podajala sama in vsaka nova stran jih je lahko pozabila — takrat je
// zvonec na njej kazal nič, čeprav je sporočilo čakalo.
// ============================================================================

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Nikoli ne vrže: nova tabela morda še ni migrirana → 0.
 *
 * Napako pa zapiše. Značka, ki ob padcu poizvedbe kaže nič, je videti enako
 * kot značka, ki nima kaj kazati — in čakajoče povpraševanje bi lahko teden
 * dni ostalo nevidno, ne da bi kaj povedalo, da je narobe.
 */
async function varno<T>(fn: () => Promise<T>, privzeto: T): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    console.error("[admin] poizvedbe za okvir ni bilo mogoče prebrati:", e);
    return privzeto;
  }
}

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const uporabnik = await zahtevajPrijavo();

  const [stevila, zvonec] = await Promise.all([
    varno(() => stejSporocila(), { novo: 0, vTeku: 0, zakljuceno: 0, skupaj: 0 }),
    varno(() => obvestila(), { neprebrana: 0, seznam: [] }),
  ]);

  const badges: AdminSidebarBadges = { sporocila: stevila.novo };

  return (
    <BreadcrumbProvider>
      <div className="bg-bg text-text fixed inset-0 flex flex-col overflow-hidden print:static print:h-auto print:overflow-visible">
        <div className="flex h-full min-h-0 print:block print:h-auto">
          <AdminSidebar badges={badges} />

          <div className="flex min-h-0 min-w-0 flex-1 flex-col print:block">
            <AdminScrollTop />
            <main
              id="admin-main"
              className="type-body bg-bg min-h-0 flex-1 overflow-y-auto pt-20 leading-normal sm:pt-24 print:overflow-visible print:pt-0"
            >
              {children}
            </main>
            <AdminFooter />
          </div>
        </div>

        <AdminTopbar
          uporabnik={uporabnik}
          obvestila={zvonec}
          mobilniPredal={<AdminSidebarNav badges={badges} />}
        />
      </div>
    </BreadcrumbProvider>
  );
}
