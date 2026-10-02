import Link from "next/link";

import { STRAN } from "@/lib/podatki";

// ============================================================================
// Noga
// ----------------------------------------------------------------------------
// Noga je zadnja priložnost za klic in prvi kraj, kamor gre človek, ki išče
// naslov ali številko. Zato nosi oboje — in nič drugega.
// ============================================================================

const POTI = [
  { href: "/ponudba", label: "Ponudba in cene" },
  { href: "/dela", label: "Dela" },
  { href: "/kontakt", label: "Kontakt" },
];

export function Noga() {
  return (
    <footer className="bg-obrat text-na-obratu mt-s5">
      <div className="px-s2 py-s4 gap-s4 mx-auto grid max-w-5xl sm:grid-cols-[1fr_auto]">
        <div>
          <p className="type-label tracking-[0.2em]">ŽAN MEKE</p>
          <p className="type-body text-na-obratu/60 mt-s2 mera">
            Spletne strani in fotografija za gostilne, apartmaje in manjša podjetja.
            {" " + STRAN.kraj}, delam po vsem {STRAN.obmocje}u.
          </p>
          <a
            href={`tel:${STRAN.telefonKlic}`}
            className="type-h3 font-naslov stevilke mt-s3 hover:text-poudarek block"
          >
            {STRAN.telefon}
          </a>
          <a
            href={`mailto:${STRAN.epota}`}
            className="type-body text-na-obratu/60 hover:text-na-obratu mt-s1 block"
          >
            {STRAN.epota}
          </a>
        </div>

        <nav className="gap-s1 flex flex-col sm:items-end">
          {POTI.map((p) => (
            <Link
              key={p.href}
              href={p.href}
              className="type-body text-na-obratu/60 hover:text-na-obratu transition-colors"
            >
              {p.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-na-obratu/10 px-s2 py-s2 mx-auto max-w-5xl border-t">
        <p className="type-micro text-na-obratu/40">
          © {new Date().getFullYear()} {STRAN.ime} · {STRAN.domena}
        </p>
      </div>
    </footer>
  );
}
