import { ArrowRight, Phone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { GUMB_NA_TEMNEM, GUMB_POLNI_NA_TEMNEM, GumbPovezava } from "@/components/ui/Gumb";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// 404
// ----------------------------------------------------------------------------
// Stran z napako je zadnja postaja pred zaprtim zavihkom, zato tu NI samo
// opravičila. Človek, ki je pristal tukaj, je nekaj iskal — dobi tri poti
// naprej in telefonsko številko, ker je ta hitrejša od vsakega iskanja.
//
// Nima glave in noge: `app/not-found.tsx` se izriše v korenski postavitvi,
// ne v javni. To je prav — meni, ki ga tu ni, nihče ne pogreša, dve povezavi
// in številka pa so dovolj.
// ============================================================================

export const metadata: Metadata = {
  title: "Strani ni",
  robots: { index: false, follow: true },
};

const POTI = [
  { href: "/ponudba", label: "Ponudba in cene" },
  { href: "/dela", label: "Dela" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function NiNajdeno() {
  return (
    <main className="plast-temna globina flex min-h-svh flex-col justify-center">
      <div className="vsebnik py-s5">
        <p className="type-poglavje text-bledo stevilke">404</p>
        <h1 className="type-display mt-s2 max-w-[14ch]">Te strani ni.</h1>
        <p className="type-lead text-mirno mt-s3 mera">
          Naslov je star ali napačno prepisan. Kar ste iskali, je verjetno na eni od
          spodnjih treh strani — če ne, pokličite in povem v pol minute.
        </p>

        <div className="mt-s4 gap-s1 flex flex-wrap items-center">
          <GumbPovezava
            href="/"
            ikona={<ArrowRight aria-hidden />}
            className={GUMB_POLNI_NA_TEMNEM}
          >
            Na domačo stran
          </GumbPovezava>
          <GumbPovezava
            href={`tel:${STRAN.telefonKlic}`}
            videz="obris"
            ikona={<Phone aria-hidden />}
            className={GUMB_NA_TEMNEM}
          >
            <span className="stevilke">{STRAN.telefon}</span>
          </GumbPovezava>
        </div>

        <ul className="mt-s4 border-crta pt-s3 gap-s3 flex flex-wrap border-t">
          {POTI.map((p) => (
            <li key={p.href}>
              <Link
                href={p.href}
                className="type-body text-mirno hover:text-crnilo transition-colors"
              >
                {p.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
