// ============================================================================
// lib/podatki.ts — vse, kar stran o sebi ve
// ----------------------------------------------------------------------------
// Ena datoteka namesto sistema za urejanje vsebine. Razlog: stran ima pet
// strani in enega urednika, ki ima razvijalca na dosegu. Admin, baza in
// prijava so troje, kar se lahko pokvari — in nič od tega ne pripelje
// naročila.
//
// Ko bo vsebine toliko, da bo urejanje v kodi nadloga, se preseli v bazo.
// Ne prej.
// ============================================================================

export const STRAN = {
  ime: "Žan Meke",
  domena: "zanmeke.com",
  url: "https://zanmeke.com",
  telefon: "041 401 521",
  telefonKlic: "+38641401521",
  epota: "info@zanmeke.com",
  kraj: "Sevnica",
  obmocje: "Posavje",
} as const;

/** Kaj dela — v eni povedi, ki mora zdržati brez pojasnila. */
export const OPIS =
  "Spletne strani za gostilne, apartmaje in manjša podjetja v Posavju — z jedilnikom, dnevnimi malicami, naročanjem in evidenco ur. Zraven fotografije, ki jih stran potrebuje.";

// ----------------------------------------------------------------------------
// Dela
// ----------------------------------------------------------------------------

export type Delo = {
  ime: string;
  kje: string;
  url?: string;
  /** Posnetek žive strani — dokaz, ki ga ni mogoče narisati. */
  slika?: string;
  /** Kaj lastniku prihrani — ne, kako izgleda. */
  izid: string;
  stanje: "živo" | "v pripravi";
};

// Na strani so SAMO dogovorjena dela. Predlog, ki ga nekomu šele pokažeš, ni
// referenca — dokler ni podpisa, ga tu ni, ker bi sicer stranka svoje ime
// našla na tuji strani, preden je rekla da.

export const DELA: Delo[] = [
  {
    ime: "Gostilnica Plus",
    kje: "gostilnica-plus.si",
    url: "https://gostilnica-plus.si",
    slika: "/dela/gostilnica-plus.png",
    izid: "Malice se vsako jutro pošljejo gostom same. Naročila padejo v admin s cenami z davčne blagajne. Evidenca delovnega časa gre računovodkinji z enim klikom.",
    stanje: "živo",
  },
  {
    ime: "Second Home",
    kje: "second-home.hr",
    url: "https://second-home.hr",
    slika: "/dela/second-home.png",
    izid: "Trije apartmaji v Dalmaciji: koledar, rezervacije, računi in plačila — v štirih jezikih.",
    stanje: "živo",
  },
];

// ----------------------------------------------------------------------------
// Težave, ki jih rešim
// ----------------------------------------------------------------------------

export const TEZAVE: Array<{ vprasanje: string; odgovor: string }> = [
  {
    vprasanje: "»Telefon zvoni ves dan — kaj je danes za malico?«",
    odgovor:
      "Malico vpišete enkrat zjutraj. Ob osmih je na strani in v poštnem predalu vsakega gosta, ki se je prijavil.",
  },
  {
    vprasanje: "»Naročila sprejemamo po telefonu, pa se zmotimo pri ceni.«",
    odgovor:
      "Spletno naročanje s cenami, kakršne so na davčni blagajni. Naročilo pride zapisano, ne narekovano.",
  },
  {
    vprasanje: "»Vsako naročilo prek portala nam odnese provizijo.«",
    odgovor: "Prek vaše strani ne stane nič. Isti gost, ista pica, cel znesek vam.",
  },
  {
    vprasanje: "»Kaj pa, če pride inšpektor po evidenco ur?«",
    odgovor:
      "Prijava, odjava, odmori in bolniška po bremenu. Izvoz za računovodstvo in natisnjen list za mapo.",
  },
];

// ----------------------------------------------------------------------------
// Cene
// ----------------------------------------------------------------------------

export type Postavka = {
  kaj: string;
  cena: string;
  opomba?: string;
  priporoceno?: boolean;
};

export const CENE: Postavka[] = [
  { kaj: "Stran z jedilnikom in malicami po e-pošti", cena: "1.990 €" },
  {
    kaj: "Isto, plus spletno naročanje",
    cena: "2.900 €",
    opomba: "najpogosteje",
    priporoceno: true,
  },
  { kaj: "Isto, plus urnik in evidenca delovnega časa", cena: "3.900 €" },
  { kaj: "Vzdrževanje, gostovanje, domena", cena: "49 € / mes" },
  { kaj: "Fotografiranje jedi in prostora", cena: "390 €" },
];

// ----------------------------------------------------------------------------
// Kako poteka
// ----------------------------------------------------------------------------

export const KORAKI: Array<{ naslov: string; opis: string }> = [
  {
    naslov: "Pogovor, pol ure",
    opis: "Pri vas, med delom. Pogledam, kaj že imate in kaj vam jemlje čas.",
  },
  {
    naslov: "Predlog s ceno",
    opis: "Dobite stran s svojim imenom in svojim jedilnikom — ne skice, ampak stran, ki jo lahko odprete.",
  },
  {
    naslov: "Izdelava",
    opis: "Fotografiram jedi in prostor, vnesem vsebino, nastavim naročanje. Vi delate naprej.",
  },
  {
    naslov: "Zagon in naprej",
    opis: "Pokažem, kako vpišete malico. Vzdrževanje teče naprej; odpoveste lahko kadarkoli, stran ostane vaša.",
  },
];
