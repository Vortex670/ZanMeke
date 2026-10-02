import { Drobno, Gumb, Naslov, Odstavek, PostniOvoj } from "./_components";

// ============================================================================
// emails/Vabilo.tsx — prvo pismo hiši, ki me ne pozna
// ----------------------------------------------------------------------------
// To je najtežja pošta na strani in edina, ki jo pišem jaz, ne stran.
//
// Tri pravila, ki odločajo, ali jo kdo prebere:
//
// 1. PRVI STAVEK GOVORI O NJIH, ne o meni. »Opazil sem, da malico objavljate
//    na Facebooku« je razlog za branje; »sem Žan in delam spletne strani« je
//    razlog za brisanje.
// 2. ENA PONUDBA IN EN GUMB. Pismo z dvema prošnjama dobi nič odgovorov.
// 3. BREZ PRILOG IN BREZ SLIK. Pismo s sliko gre pogosteje v neželeno, pri
//    prvem stiku pa je to usodno.
//
// Pismo NIMA odjavne povezave, ker ni novičnik — je osebno pismo enemu
// naslovniku. Zato tudi `razlog` pove, od kod naslov: to je po GDPR pošteno
// in zmanjša občutek vsiljenosti.
// ============================================================================

export type VabiloProps = {
  /** Ime hiše, ne osebe — ime lastnika pogosto ni javno. */
  hisa: string;
  /** Kaj sem pri njih opazil. Ena poved, konkretna. */
  opazka: string;
  /** Kaj bi se spremenilo. Ena poved, v izidu in ne v funkcijah. */
  predlog: string;
  /** Povezava na stran z deli ali na ponudbo. */
  url: string;
  telefon: string;
};

export default function Vabilo({ hisa, opazka, predlog, url, telefon }: VabiloProps) {
  return (
    <PostniOvoj
      predogled={`${hisa} — predlog za spletno stran`}
      razlog="Naslov sem našel na vaši spletni strani oziroma v javnem imeniku. Če pisma ne želite, odgovorite z »ne« in vas ne bom več motil."
    >
      <Naslov>{hisa}</Naslov>

      <Odstavek>{opazka}</Odstavek>
      <Odstavek>{predlog}</Odstavek>

      <Odstavek>
        Delam v Sevnici in sem postavil stran za gostilnico Plus — malice se zdaj
        pošljejo gostom same, naročila pridejo zapisana s cenami z blagajne. Spodaj
        lahko pogledate, kako to izgleda.
      </Odstavek>

      <Gumb href={url}>Poglejte, kaj sem naredil</Gumb>

      <Drobno>
        Če vas zanima, pokličite na {telefon} ali odgovorite na to pismo. Pol ure
        pogovora pri vas, brez obveznosti — po njem veste ceno in rok.
      </Drobno>
    </PostniOvoj>
  );
}

Vabilo.PreviewProps = {
  hisa: "Gostilna Pri Treh Lipah",
  opazka:
    "Opazil sem, da dnevno malico vsak dan objavite na Facebooku, na vaši strani pa je ni.",
  predlog:
    "Malico bi vpisali enkrat zjutraj, ob osmih pa bi bila na strani in v poštnem predalu vsakega gosta, ki se je prijavil.",
  url: "https://zanmeke.com/dela",
  telefon: "041 401 521",
} satisfies VabiloProps;
