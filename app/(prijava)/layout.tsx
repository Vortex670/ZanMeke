import type { Metadata } from "next";
import Link from "next/link";

import { AuthOzadje } from "@/components/auth/AuthOzadje";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// Veža administracije
// ----------------------------------------------------------------------------
// Ni del javne strani, zato brez glave s telefonsko številko in brez noge s
// ponudbo. Kdor se prijavlja, ne potrebuje gumba »Pokliči« — ta je zanj.
//
// Ista postavitev kot na gostilnica-plus.si in second-home.hr: ambientno
// ozadje, tanka vrstica z znakom zgoraj, vsebina navpično na sredini, drobna
// noga. Kdor pozna eno administracijo, pozna vse tri.
// ============================================================================

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function PrijavaPostavitev({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-papir text-crnilo relative flex min-h-dvh flex-col overflow-x-clip">
      <AuthOzadje />

      <header className="px-s2 py-s2 relative z-10 flex items-center justify-between gap-3">
        <Link href="/" className="leading-none">
          <span className="type-label block tracking-[0.22em]">ŽAN MEKE</span>
          <span className="type-micro text-bledo mt-1 block">
            SPLETNE STRANI · FOTOGRAFIJA
          </span>
        </Link>
        <Link
          href="/"
          className="type-label text-bledo hover:text-crnilo transition-colors"
        >
          Nazaj na stran
        </Link>
      </header>

      <main className="px-s2 py-s3 relative z-10 flex flex-1 flex-col justify-center">
        {children}
      </main>

      <footer className="px-s2 py-s2 type-micro text-bledo relative z-10 flex flex-col items-center gap-1 text-center sm:flex-row sm:justify-between">
        <span className="stevilke">
          © {new Date().getFullYear()} {STRAN.ime}
        </span>
        <span>Administracija</span>
      </footer>
    </div>
  );
}
