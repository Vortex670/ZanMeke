import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ObrazecPrijava } from "@/components/public/prijava/ObrazecPrijava";
import { trenutniUporabnik } from "@/lib/auth/seja";

// ============================================================================
// /prijava — vrata v admin
// ----------------------------------------------------------------------------
// Stran ni v meniju in je `noindex`: do nje pride, kdor ve zanjo. To ni
// varovalo (varuje straža), ampak red — javni obiskovalec nima kaj iskati
// na prijavni strani.
// ============================================================================

export const metadata: Metadata = {
  title: "Prijava",
  robots: { index: false, follow: false },
};

export default async function Prijava() {
  if (await trenutniUporabnik()) redirect("/admin");

  return (
    <section className="bg-obrat text-na-obratu globina min-h-svh">
      <div className="px-s2 mx-auto flex min-h-svh max-w-md flex-col justify-center">
        <p className="type-label text-poudarek">Admin</p>
        <h1 className="type-h2 mt-s1">Prijava</h1>

        <div className="bg-ploskev text-crnilo mt-s3 p-s3 rounded-[2px]">
          <ObrazecPrijava />
        </div>
      </div>
    </section>
  );
}
