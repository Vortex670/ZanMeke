"use client";

import { Check, Clock } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Spinner } from "@/components/ui/Spinner";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// <CakanjeNaPotrditev /> — med plačilom in potrdilom
// ----------------------------------------------------------------------------
// STRAN SE RES SAMA POSODOBI. Doslej je to samo PISALO: besedilo je obljubilo,
// da se bo stran osvežila, ko banka potrdi, nič pa tega ni počelo. Kdor je
// čakal, je čakal v nedogled in na koncu osvežil sam — ali pa odšel z
// občutkom, da plačilo ni šlo skozi.
//
// Osvežuje se s `router.refresh()`, ne z novim nalaganjem strani: strežniška
// komponenta se izriše znova, stanje se prebere iz baze, nič pa ne poskoči.
//
// POTEK ČAKANJA ima tri dele, ker trije časi pomenijo tri različne stvari:
//   do 20 s   — običajno; Stripov webhook pride v nekaj sekundah
//   do 90 s   — še vedno v mejah; pri SEPA in nekaterih karticah traja dlje
//   nad 90 s  — nekaj ni v redu; takrat ponudimo telefon in NE trdimo, da
//               je vse v najlepšem redu
//
// Poizvedovanje se po dveh minutah ustavi. Zavihek, ki do jutri vsakih pet
// sekund odpira zahtevo na strežnik, ni vztrajnost, ampak puščanje luči.
// ============================================================================

const RAZMIK_MS = 4000;
const NAJVEC_S = 120;

export function CakanjeNaPotrditev() {
  const router = useRouter();
  const [sekund, nastaviSekund] = useState(0);

  useEffect(() => {
    const zacetek = Date.now();
    const ura = setInterval(() => {
      const pretekle = Math.round((Date.now() - zacetek) / 1000);
      nastaviSekund(pretekle);
      if (pretekle > NAJVEC_S) {
        clearInterval(ura);
        return;
      }
      router.refresh();
    }, RAZMIK_MS);
    return () => clearInterval(ura);
  }, [router]);

  const obupano = sekund > NAJVEC_S;
  const dolgo = sekund > 20;

  return (
    <div className="border-crta bg-ploskev p-s3 mera rounded-2xl border">
      {/* Trije koraki povedo, kje v poti smo. Pika, ki še ni dosežena, je
          bleda; dosežena je polna — brez odstotkov, ker odstotka nihče ne
          pozna in izmišljen odstotek je laž z decimalko. */}
      <ol className="gap-s2 mb-s3 flex flex-wrap items-center">
        <Korak koncan>Plačilo oddano</Korak>
        <Crta />
        <Korak koncan={false} tece={!obupano}>
          Potrditev banke
        </Korak>
        <Crta />
        <Korak koncan={false}>Potrdilo po e-pošti</Korak>
      </ol>

      <p className="type-h3">{obupano ? "Potrditev se zatika" : "Plačilo je oddano"}</p>

      <p className="type-small text-mirno mt-1">
        {obupano ? (
          <>
            Banka potrditve ni poslala v dveh minutah. Denar je najverjetneje odšteti — ne
            plačujte še enkrat. Pokličite {STRAN.telefon} in pogledam takoj.
          </>
        ) : dolgo ? (
          <>
            Traja malo dlje kot običajno. Pri nekaterih karticah in pri SEPA je to
            normalno; zavihka vam ni treba imeti odprtega — potrdilo pride po e-pošti.
          </>
        ) : (
          <>
            Čakam potrditev banke; navadno traja nekaj sekund. Stran se posodobi sama,
            potrdilo pa pride po e-pošti.
          </>
        )}
      </p>

      {!obupano ? (
        <p className="type-micro text-bledo mt-s2 flex items-center gap-2">
          <Spinner size="sm" className="text-poudarek" label="Čakam potrditev" />
          <span className="stevilke">{sekund} s</span>
        </p>
      ) : null}
    </div>
  );
}

function Crta() {
  return <span aria-hidden className="bg-crta h-px w-6 shrink-0" />;
}

function Korak({
  koncan,
  tece,
  children,
}: {
  koncan: boolean;
  tece?: boolean;
  children: React.ReactNode;
}) {
  return (
    <li className="type-micro flex items-center gap-1.5">
      <span
        aria-hidden
        className={
          koncan
            ? "bg-poudarek text-na-poudarku flex size-4 items-center justify-center rounded-full"
            : tece
              ? "border-poudarek size-4 rounded-full border-2"
              : "border-crta size-4 rounded-full border-2"
        }
      >
        {koncan ? <Check className="size-2.5" strokeWidth={3.2} /> : null}
      </span>
      <span className={koncan || tece ? "text-crnilo" : "text-bledo"}>{children}</span>
    </li>
  );
}

/** Ikona za plačano stanje — da je uvoz na enem mestu. */
export const IkonaCakanja = Clock;
