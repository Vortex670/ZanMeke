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
  /** Rodilnik: »iz Sevnice«. Sklona ni mogoče dobiti z lepljenjem črke. */
  krajIz: "Sevnice",
  obmocje: "Posavje",
  /** Mestnik: »po vsem Posavju«. Sklanjatve ni mogoče dobiti z lepljenjem
      črke na imenovalnik — iz »Posavje« + »u« nastane »Posavjeu«. */
  obmocjeV: "Posavju",
} as const;

/**
 * Kaj dela — v eni povedi, ki mora zdržati brez pojasnila.
 *
 * ŠIROKO IN VSEENO SVOJE. Ne našteva panog, ker stran dela za vsakogar, ki
 * ima podjetje, obrt ali dejavnost. Loči pa se po tem, kaj stran POČNE:
 * sprejme naročilo, rezervacijo ali povpraševanje in prihrani klic. Stran,
 * ki samo izgleda, zna danes narediti vsak.
 *
 * Primeri panog so na podstraneh, kjer imam dokaz — ne tu.
 */
export const OPIS =
  "Spletne strani, ki ne samo izgledajo, ampak nekaj naredijo: sprejmejo naročilo, rezervacijo ali povpraševanje in vam prihranijo klic. In fotografije, posnete pri vas.";

// ----------------------------------------------------------------------------
// Dela
// ----------------------------------------------------------------------------

export type Delo = {
  ime: string;
  kje: string;
  url?: string;
  /** Posnetek žive strani — dokaz, ki ga ni mogoče narisati. */
  slika?: string;
  /** Kaj podjetju vsak dan prihrani — ne, kako izgleda. */
  izid: string;
  stanje: "živo" | "v pripravi";
  /**
   * Čigava je stran.
   *
   * To MORA pisati na strani. Obe spodnji sta moji lastni — postavil sem ju
   * zase in ju vsak dan vodim. Če bi stali v seznamu brez oznake, bi bralec
   * razumel, da sta naročnikovi; v Sevnici, kjer vsak ve, čigava je
   * gostilna, je taka tišina najhitrejši način, da izgubiš zaupanje.
   *
   * Lastna stran je šibkejši dokaz od naročnikove — in močnejši od
   * posnetka zaslona brez naslova. Zato stoji tu, označena.
   */
  vrsta: "lastna" | "narocnik";
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
    vrsta: "lastna",
  },
  {
    ime: "Second Home",
    kje: "second-home.hr",
    url: "https://second-home.hr",
    slika: "/dela/second-home.png",
    izid: "Trije apartmaji v Dalmaciji: koledar, rezervacije, računi in plačila — v štirih jezikih.",
    stanje: "živo",
    vrsta: "lastna",
  },
];

// ----------------------------------------------------------------------------
// Težave, ki jih rešim
// ----------------------------------------------------------------------------

export const TEZAVE: Array<{ vprasanje: string; odgovor: string }> = [
  {
    vprasanje: "»Telefon zvoni ves dan z istimi vprašanji.«",
    odgovor:
      "Kar sprašujejo vsak dan — cena, odpiralni čas, ali imate prosto — stoji na strani in se posodobi, ko to vpišete vi.",
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
// TRIJE PAKETI in ne cenik s sedmimi vrsticami. Vrstice v tabeli je treba
// brati in primerjati; tri kartice se primerjajo same. Srednji je označen kot
// najpogostejši, ker se ljudje ob treh možnostih skoraj vedno odločijo za
// sredino — in ker je res tisti, ki največ prihrani.
//
// Cena je ZNANA VNAPREJ in javno zapisana. »Cena po dogovoru« pomeni en klic
// več pred odločitvijo, in ta klic se največkrat ne zgodi.
//
// CENA IZHAJA IZ VREDNOSTI, NE IZ UR — a mora ostati dosegljiva.
//
// Izračun na /ponudba pri običajnih vrednostih pokaže okoli 180 ur na leto,
// kar je nekaj čez 2.000 €. V treh letih je to 6.000 €, in pravilo palca
// pravi, da naj cena znaša 10–20 % ustvarjene vrednosti. Po tem bi sistem
// smel stati 2.500 € ali več.
//
// Toliko tudi stane — pri agenciji. Tu je ceneje, ker je osnova narejena,
// in ker kupec ni verižna restavracija, ampak obrt s tremi zaposlenimi, ki
// mora znesek vzeti iz letošnjega prometa. Zato so cene postavljene na
// spodnji rob tega razpona in ne na sredino:
//
//   1.190 €  vstop
//   1.990 €  sistem, pod dvema tisočakoma
//   2.990 €  s celotno evidenco dela, pod tremi
//
// Prag pod okroglo številko ni trik, ampak razlika med »to grem vprašat« in
// »to je zame predrago«. Prejšnje cene (990 / 1.790 / 2.690) so bile pod
// istimi pragovi, a je vmes 200–300 €, ki jih je delo vredno — in 990 € je
// številka, ki jo kupec prebere kot ceno predloge, ne kot ceno dela.
//
// Česar ne naredimo: popusta. Znižana cena repozicionira izdelek navzdol in
// nauči kupca čakati na naslednjo. Kadar je treba dodati, se doda vrednost
// — bonus, hitrejši rok, jamstvo — pri isti ceni.
//
// Kar se prodaja, NI teden dela — je sistem, ki že teče: vsebina, ki jo
// urejaš sam, sprejem naročil in povpraševanj, urnik in evidenca ur po
// ZEPDSV. Agencija za isto zaračuna šest do osem tisoč in dela tri mesece,
// ker gradi od začetka. Pri meni je osnova narejena, zato je ceneje in zato
// je v enem tednu — ne zato, ker bi bilo manj vredno.
//
// Mesečnih 49 € ni strošek gostovanja, ampak dohodek, ki teče naprej: deset
// strank je 490 € vsak mesec, ne glede na to, ali tisti mesec kaj delam.
// Prav ta številka se sešteva, zato je bilo 39 € prenizko — pod petdesetimi
// evri gostovanje, varnostne kopije in pomoč po telefonu niso plačani.
// ----------------------------------------------------------------------------

export type Paket = {
  kljuc: string;
  ime: string;
  /** Komu je namenjen — v enem stavku, da se človek prepozna. */
  komu: string;
  cena: string;
  /** Kaj je v njem; prva postavka je tisto, po čemer se loči od prejšnjega. */
  vsebuje: string[];
  priporoceno?: boolean;
};

export const PAKETI: Paket[] = [
  {
    kljuc: "osnova",
    ime: "Stran",
    komu: "Za podjetje, ki strani nima ali ima staro, ki je na telefonu ni mogoče brati.",
    cena: "1.190 €",
    vsebuje: [
      "Vsebina, ki jo urejate sami",
      "Google, zemljevid, odpiralni čas",
      "Prilagojeno telefonu",
      "Fotografije prostora",
    ],
  },
  {
    kljuc: "sistem",
    ime: "Sistem",
    komu: "Za podjetje, ki vsak dan nekaj objavlja ali sprejema — ponudbo, naročila, rezervacije ali povpraševanja.",
    cena: "1.990 €",
    priporoceno: true,
    vsebuje: [
      "Vse iz paketa Stran",
      "Sprejemanje naročil, rezervacij ali povpraševanj na strani",
      "Dnevna ali tedenska ponudba, ki se pošlje strankam po e-pošti",
      "Brez provizije portalom in posrednikom",
    ],
  },
  {
    kljuc: "obrat",
    ime: "Sistem z obratom",
    komu: "Za podjetje z zaposlenimi — urnik in evidenca ur, kakršno zahteva inšpekcija.",
    cena: "2.990 €",
    vsebuje: [
      "Vse iz paketa Sistem",
      "Urnik izmen in prijava na delo",
      "Evidenca ur po ZEPDSV",
      "Izvoz za računovodstvo",
    ],
  },
];

/** Kar se doda h kateremu koli paketu. */
export const DODATNO: Array<{ kaj: string; cena: string; opis: string }> = [
  {
    kaj: "Vzdrževanje, gostovanje, domena",
    cena: "49 € / mes",
    opis: "Posodobitve, varnostne kopije in pomoč po telefonu. Odpoveste kadarkoli.",
  },
  {
    kaj: "Fotografiranje izdelkov in prostora",
    cena: "350 €",
    opis: "Pol dneva pri vas, obdelane slike v treh dneh. Posnete za vašo stran.",
  },
];

// ----------------------------------------------------------------------------
// Jamstvo in prva referenca
// ----------------------------------------------------------------------------
// JAMSTVO JE NAJMOČNEJŠI DEL PONUDBE in ne drobni tisk. Kupec, ki te ne pozna,
// ne tehta cene — tehta tveganje, da plača in dobi nekaj, česar ne bo znal
// uporabljati. Jamstvo to tveganje prenese nazaj name, kjer tudi sodi: jaz
// vem, ali sistem dela, on tega ne more vedeti vnaprej.
//
// Mora biti MERLJIVO. »Zadovoljstvo zagotovljeno« ne pomeni nič, ker nihče ne
// ve, kdaj je izpolnjeno. Ena ura na teden je številka, ki jo lastnik lahko
// prešteje — in ravno zato se mu zdi resna.
//
// PRVA REFERENCA NI POPUST. Znižana cena repozicionira izdelek navzdol in
// nauči kupca čakati na naslednji popust; cena ostane cela, zraven pa gresta
// dve stvari, ki me stanejo čas in ne denarja — v zameno za priporočilo, ki
// ga ne morem kupiti.
// ----------------------------------------------------------------------------

export const JAMSTVO = {
  naslov: "Jamstvo za prihranjen čas",
  obljuba:
    "Če v prvem mesecu po zagonu ne prihranite vsaj ene ure na teden, vam vzdrževanje za prvo leto odpišem.",
  pojasnilo:
    "Brez pogajanja in brez dokazovanja — dovolj je, da to rečete. Tvegam jaz, ker edini od naju vnaprej ve, ali sistem dela.",
} as const;

export const PRVA_REFERENCA = {
  naslov: "Prvima dvema strankama v Posavju",
  obljuba:
    "Polna cena, zraven pa prvo leto vzdrževanja in fotografiranje — v zameno za napisano priporočilo in dovoljenje, da stran objavim med deli.",
  pojasnilo:
    "Ne znižujem cene; kar dobite zraven, me stane čas in ne vas denarja. Rabim prvi dve zunanji referenci in to je pošten način, da ju dobim.",
} as const;

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
    opis: "Dobite stran s svojim imenom in svojo vsebino — ne skice, ampak stran, ki jo lahko odprete.",
  },
  {
    naslov: "Izdelava",
    opis: "Fotografiram izdelke in prostor, vnesem vsebino, nastavim obrazce. Vi delate naprej.",
  },
  {
    naslov: "Zagon in naprej",
    opis: "Pokažem, kako vsebino urejate sami. Vzdrževanje teče naprej; odpoveste lahko kadarkoli, stran ostane vaša.",
  },
];

// ----------------------------------------------------------------------------
// Dvoje, kar delam
// ----------------------------------------------------------------------------
// Dve storitvi in ne seznam veščin. Prejšnja stran je naštevala sedem stvari
// in obiskovalec ni vedel, za kaj naj pokliče. Tu sta dve, vsaka s svojo ceno
// in svojim izidom — in obe isti človek, kar je pri eni strani prednost:
// fotografije so posnete za to postavitev in ne kupljene na zalogi.
// ----------------------------------------------------------------------------

export type Storitev = {
  kljuc: "splet" | "foto";
  naslov: string;
  /** Ena poved, ki pove izid — ne postopka. */
  povzetek: string;
  /** Tri stvari, ki jih človek dobi. Ne več: četrte nihče ne prebere. */
  tocke: [string, string, string];
  cenaOd: string;
};

export const STORITVE: Storitev[] = [
  {
    kljuc: "splet",
    naslov: "Spletne strani",
    povzetek:
      "Stran, ki namesto vas odgovarja na telefon: cenik, ponudba, naročila, rezervacije in povpraševanja. Vsebino urejate sami, brez klica meni.",
    tocke: [
      "Vsebino urejate sami, brez klica meni",
      "Deluje na telefonu in v Googlu",
      "Vzdrževanje in gostovanje, če želite",
    ],
    cenaOd: "od 1.190 €",
  },
  {
    kljuc: "foto",
    naslov: "Fotografija",
    povzetek:
      "Izdelki, prostor in ljudje — posneto za vašo stran in za objave, ne izbrano iz zaloge.",
    tocke: [
      "Fotografiram pri vas, med delom",
      "Obdelane slike v treh dneh",
      "Pripravljene za stran in družbena omrežja",
    ],
    cenaOd: "od 350 €",
  },
];

// ----------------------------------------------------------------------------
// Pogosta vprašanja
// ----------------------------------------------------------------------------
// Tu in ne na strani: iste odgovore berejo trije — stran (`/ponudba`),
// strukturirani podatki (`FAQPage`) in `llms.txt`. Ko so bili zapisani v
// strani, sta druga dva dobila, kar je ostalo.
//
// Odgovor mora biti CELA POVED, kot bi jo povedal po telefonu: jezikovni
// model ga citira brez strani okoli njega, zato sklicevanje na »zgoraj« v
// odgovoru ne pomeni ničesar.
// ----------------------------------------------------------------------------

export const VPRASANJA: Array<{ q: string; a: string }> = [
  {
    q: "Koliko časa traja?",
    a: "Teden dni od dogovora do žive strani, če so besedila in fotografije pripravljeni. Fotografiram v istem tednu.",
  },
  {
    q: "Kaj če ne znam urejati?",
    a: "Vsebino vpišeš v dveh minutah — to ti pokažem na mestu. Če ti je lažje, mi jo pošlješ in jo vpišem jaz; to je del vzdrževanja.",
  },
  {
    q: "Moram podpisati dolgo pogodbo?",
    a: "Ne. Vzdrževanje odpoveš kadarkoli, stran in domena ostaneta tvoji. Nimam vezave na leto.",
  },
  {
    q: "Že imam stran, ki je ne maram.",
    a: "Potem jo pogledam in ti povem, ali se jo splača popraviti ali narediti na novo. Če se splača popraviti, to tudi rečem.",
  },
  {
    q: "Kdaj plačam?",
    a: "Polovica ob začetku, polovica ob zagonu. Vzdrževanje teče od zagona naprej, mesečno.",
  },
];
