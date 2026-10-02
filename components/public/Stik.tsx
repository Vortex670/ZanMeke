import { ArrowUpRight, Mail, MapPin } from "lucide-react";
import Link from "next/link";

import { Odsek } from "@/components/public/Odsek";
import { STRAN } from "@/lib/podatki";

// ============================================================================
// <Stik /> — zadnji pas vsake javne strani
// ----------------------------------------------------------------------------
// Ta pas ni kartica sredi strani, ampak POSTAJA: temen, čez vso širino, in
// na njem je ena sama velika stvar — telefonska številka. Prej je bil gumb
// velik kot vsak drug gumb in se je izgubil med dvema drugima; tu je številka
// največja pisava na strani, ker je edino dejanje, ki prinese delo.
//
// Druga pot (obrazec) je povezava in ne gumb. Dva enako močna gumba pomenita
// izbiro, izbira pa pomeni odlog.
//
// Isti pas na treh straneh: ena oblika, trije naslovi.
// ============================================================================

export function Stik({
  naslov,
  uvod,
  druga,
}: {
  naslov: string;
  uvod: string;
  /** Druga, tišja pot — obrazec ali cenik. */
  druga?: { href: string; besedilo: string };
}) {
  return (
    <Odsek plast="temna" sirina="ozek" as="section">
      <p className="type-poglavje text-poudarek">Stik</p>
      <h2 className="type-display pometanje mt-s2 max-w-[18ch]">{naslov}</h2>
      <p className="type-lead text-mirno mt-s3 mera">{uvod}</p>

      {/* Številka kot naslov. Tabularne števke, da se cifre ne majejo, in
          podčrtaj, ki se nariše ob dotiku — povezava mora biti videti kot
          povezava tudi takrat, kadar je velika kot naslov. */}
      <a
        href={`tel:${STRAN.telefonKlic}`}
        className="type-display stevilke mt-s4 group text-crnilo decoration-poudarek inline-flex items-center gap-4 underline-offset-[0.12em] hover:underline"
      >
        {STRAN.telefon}
        <ArrowUpRight
          className="size-[0.55em] shrink-0 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
          strokeWidth={1.6}
          aria-hidden
        />
      </a>

      <div className="mt-s4 gap-s3 border-crta pt-s3 flex flex-wrap items-center border-t">
        {druga ? (
          <Link
            href={druga.href}
            className="type-label text-poudarek gap-s1 inline-flex items-center hover:underline"
          >
            {druga.besedilo}
            <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        ) : null}

        <a
          href={`mailto:${STRAN.epota}`}
          className="type-small text-mirno hover:text-crnilo gap-s1 inline-flex items-center transition-colors"
        >
          <Mail className="size-4" strokeWidth={1.6} aria-hidden />
          {STRAN.epota}
        </a>

        <p className="type-small text-bledo gap-s1 inline-flex items-center">
          <MapPin className="size-4" strokeWidth={1.6} aria-hidden />
          {STRAN.kraj} · po vsem {STRAN.obmocjeV}
        </p>
      </div>
    </Odsek>
  );
}
