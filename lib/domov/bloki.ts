// ============================================================================
// lib/domov/bloki.ts — register odsekov javnih strani
// ----------------------------------------------------------------------------
// KATERI odseki obstajajo, pove KODA; kaj je urednik z njimi naredil (vrstni
// red, vidnost, besedilo), pa baza. Zato nov odsek ne potrebuje migracije
// vsebine, star pa se z odstranitvijo iz registra preprosto neha izrisovati.
//
// Vsak odsek pove tudi, ali ima kaj za urediti. Odseki, ki berejo iz drugih
// virov (dela, storitve s cenami), imajo tu samo naslov in uvod — kartice v
// njih živijo tam, kjer so njihovi podatki.
//
// Ista oblika kot na gostilnica-plus.si, da sta urejevalnik in `lib/domov`
// na obeh straneh ena koda. Razlika je, da tu register pokriva ŠTIRI strani
// in ne samo domače — urejevalnik je isti, spremeni se le seznam odsekov.
// ============================================================================

export type PoljeVrsta = "besedilo" | "odstavek" | "slika" | "video";

export type BlokPolje = {
  kljuc: string;
  label: string;
  vrsta: PoljeVrsta;
  hint?: string;
  najvec: number;
};

/**
 * Naslov slike ali videa je dolg — podpisan naslov iz shrambe presega sto
 * znakov. Ta meja velja za vsa polja vrste »slika« in »video«, da je ni
 * treba pisati pri vsakem posebej.
 */
export const MEDIJ_NAJVEC = 500;

export type BlokDef = {
  kljuc: string;
  ime: string;
  opis: string;
  /** Odseka ni mogoče skriti — brez njega stran nima začetka. */
  obvezen?: boolean;
  polja: BlokPolje[];
};

/** Strani, ki imajo urejevalnik odsekov. */
export const STRANI = ["domov", "ponudba", "dela", "kontakt"] as const;
export type StranKljuc = (typeof STRANI)[number];

export const STRAN_NAPIS: Record<StranKljuc, string> = {
  domov: "Domov",
  ponudba: "Ponudba",
  dela: "Dela",
  kontakt: "Kontakt",
};

/** Javna pot strani — za gumb »Odpri stran«. */
export const STRAN_POT: Record<StranKljuc, string> = {
  domov: "/",
  ponudba: "/ponudba",
  dela: "/dela",
  kontakt: "/kontakt",
};

const DOMOV: BlokDef[] = [
  {
    kljuc: "hero",
    ime: "Uvodni zaslon",
    opis: "Prvo, kar obiskovalec vidi: kraj, naslov, uvod in posnetek žive strani.",
    obvezen: true,
    polja: [
      {
        kljuc: "oznaka",
        label: "Oznaka nad naslovom",
        vrsta: "besedilo",
        hint: "Privzeto kraj in območje, npr. »Sevnica · Posavje«.",
        najvec: 60,
      },
      {
        kljuc: "naslov",
        label: "Naslov",
        vrsta: "besedilo",
        hint: "Najpomembnejša poved na strani. Naj pove, kaj delaš in za koga.",
        najvec: 90,
      },
      {
        kljuc: "uvod",
        label: "Uvod pod naslovom",
        vrsta: "odstavek",
        hint: "Ena poved o izidu, ne o postopku.",
        najvec: 220,
      },
      {
        kljuc: "podnapis",
        label: "Podnapis pod posnetkom",
        vrsta: "besedilo",
        najvec: 120,
      },
      {
        kljuc: "slika",
        label: "Posnetek strani",
        vrsta: "slika",
        hint: "Pot do slike v projektu. Brez nje ostane privzeti posnetek.",
        najvec: MEDIJ_NAJVEC,
      },
    ],
  },
  {
    kljuc: "dejstva",
    ime: "Pas dejstev",
    opis: "Tri reči, ki jih človek preveri, preden koga pokliče.",
    polja: [
      { kljuc: "odziv", label: "Odziv — vrednost", vrsta: "besedilo", najvec: 40 },
      { kljuc: "odzivPod", label: "Odziv — pojasnilo", vrsta: "besedilo", najvec: 60 },
      { kljuc: "kje", label: "Kje — vrednost", vrsta: "besedilo", najvec: 40 },
      { kljuc: "kjePod", label: "Kje — pojasnilo", vrsta: "besedilo", najvec: 60 },
      { kljuc: "zivoPod", label: "V živo — pojasnilo", vrsta: "besedilo", najvec: 60 },
    ],
  },
  {
    kljuc: "storitve",
    ime: "Dvoje, kar delam",
    opis: "Naslov odseka s kartično ponudbo. Kartici in ceni živita v ponudbi.",
    polja: [
      { kljuc: "oznaka", label: "Oznaka", vrsta: "besedilo", najvec: 40 },
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 240 },
    ],
  },
  {
    kljuc: "dela",
    ime: "Dela",
    opis: "Naslov odseka z živimi stranmi. Same strani se urejajo v podatkih del.",
    polja: [
      { kljuc: "oznaka", label: "Oznaka", vrsta: "besedilo", najvec: 40 },
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 240 },
    ],
  },
  {
    kljuc: "stik",
    ime: "Stik",
    opis: "Zadnji pas s telefonsko številko — zadnja priložnost za klic.",
    obvezen: true,
    polja: [
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 240 },
      {
        kljuc: "druga",
        label: "Napis drugega gumba",
        vrsta: "besedilo",
        hint: "Pelje na obrazec. Prvi gumb je vedno telefon.",
        najvec: 40,
      },
    ],
  },
];

const PONUDBA: BlokDef[] = [
  {
    kljuc: "uvod",
    ime: "Uvodni zaslon",
    opis: "Temni pas na vrhu strani s ponudbo.",
    obvezen: true,
    polja: [
      { kljuc: "oznaka", label: "Oznaka", vrsta: "besedilo", najvec: 40 },
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 260 },
    ],
  },
  {
    kljuc: "cene",
    ime: "Cene",
    opis: "Naslov nad paketi. Paketi in zneski so v podatkih ponudbe.",
    obvezen: true,
    polja: [
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod pod naslovom", vrsta: "odstavek", najvec: 240 },
    ],
  },
  {
    kljuc: "vkljuceno",
    ime: "Vključeno in ni vključeno",
    opis: "Dva stolpca. Nepovedana izključitev je edino, kar pokvari posel po podpisu.",
    polja: [],
  },
  {
    kljuc: "koraki",
    ime: "Kako poteka",
    opis: "Štirje koraki od pogovora do žive strani.",
    polja: [{ kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 }],
  },
  {
    kljuc: "vprasanja",
    ime: "Vprašanja",
    opis: "Zložljiva vprašanja. Isti odgovori gredo v strukturirane podatke za Google.",
    polja: [{ kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 }],
  },
  {
    kljuc: "stik",
    ime: "Stik",
    opis: "Zadnji pas s telefonsko številko.",
    obvezen: true,
    polja: [
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 240 },
    ],
  },
];

const DELA: BlokDef[] = [
  {
    kljuc: "uvod",
    ime: "Uvodni zaslon",
    opis: "Temni pas na vrhu strani z deli.",
    obvezen: true,
    polja: [
      { kljuc: "oznaka", label: "Oznaka", vrsta: "besedilo", najvec: 40 },
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 260 },
    ],
  },
  {
    kljuc: "primeri",
    ime: "Primeri del",
    opis: "Žive strani s posnetkom in izidom. Sami primeri se urejajo v podatkih del.",
    obvezen: true,
    polja: [],
  },
  {
    kljuc: "stik",
    ime: "Stik",
    opis: "Zadnji pas s telefonsko številko.",
    obvezen: true,
    polja: [
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 240 },
    ],
  },
];

const KONTAKT: BlokDef[] = [
  {
    kljuc: "uvod",
    ime: "Uvodni zaslon",
    opis: "Kaj obiskovalec dobi, če napiše — in kdaj.",
    obvezen: true,
    polja: [
      { kljuc: "oznaka", label: "Oznaka", vrsta: "besedilo", najvec: 40 },
      { kljuc: "naslov", label: "Naslov", vrsta: "besedilo", najvec: 90 },
      { kljuc: "uvod", label: "Uvod", vrsta: "odstavek", najvec: 260 },
    ],
  },
  {
    kljuc: "obrazec",
    ime: "Obrazec",
    opis: "Naslov nad obrazcem in pomirjujoča vrstica pod gumbom.",
    obvezen: true,
    polja: [
      { kljuc: "naslov", label: "Naslov nad obrazcem", vrsta: "besedilo", najvec: 90 },
      {
        kljuc: "zasebnost",
        label: "Vrstica pod gumbom",
        vrsta: "besedilo",
        hint: "Kaj se zgodi s podatki. Kratko — tu se ljudje ustavijo.",
        najvec: 160,
      },
    ],
  },
];

/** Vsi registri na enem mestu. */
export const BLOKI_PO_STRANEH: Record<StranKljuc, BlokDef[]> = {
  domov: DOMOV,
  ponudba: PONUDBA,
  dela: DELA,
  kontakt: KONTAKT,
};

/** Združljivost z domačo stranjo, ki je bila prva. */
export const BLOKI: BlokDef[] = DOMOV;

/** Vrstni red, v katerem odseki stojijo, dokler jih urednik ne premakne. */
export function privzetiVrstniRed(stran: StranKljuc): string[] {
  return BLOKI_PO_STRANEH[stran].map((b) => b.kljuc);
}

export const PRIVZETI_VRSTNI_RED: string[] = privzetiVrstniRed("domov");

export function najdiBlok(stran: StranKljuc, kljuc: string): BlokDef | undefined {
  return BLOKI_PO_STRANEH[stran].find((b) => b.kljuc === kljuc);
}

/** Ali je niz ena od naših strani — za preverjanje poti v naslovu. */
export function jeStran(v: string): v is StranKljuc {
  return (STRANI as readonly string[]).includes(v);
}
