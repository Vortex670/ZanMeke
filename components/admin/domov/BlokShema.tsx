import { cn } from "@/lib/utils";

// ============================================================================
// <BlokShema> — risba postavitve odseka
// ----------------------------------------------------------------------------
// Ne predogled vsebine, ampak POSTAVITEV: ali je odsek čez cel zaslon, v dveh
// stolpcih, v treh karticah ali kot izmenične vrstice. Urednik po njej v pol
// sekunde ve, kateri odsek premika — ime samo tega ne pove.
//
// Narisana je z okvirčki in ne s sliko: slika bi se ob vsaki spremembi
// oblikovanja postarala, okvirčki pa povedo le razmerja, ki se ne spremenijo.
// ============================================================================

const OKVIR =
  "relative aspect-[4/3] w-16 shrink-0 overflow-hidden rounded-md border border-border bg-bg p-1";

/** Črta besedila; `w` je delež širine. */
function Crta({ w = "w-full", temna = false }: { w?: string; temna?: boolean }) {
  return (
    <span
      className={cn("block h-1 rounded-full", temna ? "bg-text/50" : "bg-text/20", w)}
    />
  );
}

export function BlokShema({ kljuc, className }: { kljuc: string; className?: string }) {
  const okvir = cn(OKVIR, className);

  switch (kljuc) {
    // Uvodni zaslon: temna ploskev čez vse, naslov spodaj levo.
    case "hero":
      return (
        <div className={cn(okvir, "bg-text/85 flex flex-col justify-end gap-1 p-1.5")}>
          <span className="bg-accent block h-1 w-4 rounded-full" />
          <span className="block h-1.5 w-11 rounded-full bg-white/80" />
          <span className="block h-1 w-8 rounded-full bg-white/40" />
        </div>
      );

    // Dva stolpca: levo slika, desno besedilo.
    case "malica":
      return (
        <div className={cn(okvir, "flex gap-1")}>
          <span className="bg-text/70 block w-1/2 rounded-sm" />
          <span className="flex w-1/2 flex-col justify-center gap-1">
            <Crta w="w-full" temna />
            <Crta w="w-4/5" />
            <Crta w="w-3/5" />
          </span>
        </div>
      );

    // Kartice v mreži.
    case "tedenska":
      return (
        <div className={cn(okvir, "grid grid-cols-2 gap-1")}>
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className="border-border bg-surface rounded-sm border" />
          ))}
        </div>
      );

    // Citat: sredinsko besedilo, nič drugega.
    case "citat":
      return (
        <div
          className={cn(okvir, "flex flex-col items-center justify-center gap-1 px-1.5")}
        >
          <Crta w="w-10" temna />
          <Crta w="w-8" temna />
          <span className="mt-0.5 block h-0.5 w-4 rounded-full bg-(--accent)" />
        </div>
      );

    // Trije stolpci.
    case "nacela":
      return (
        <div className={cn(okvir, "grid grid-cols-3 gap-1")}>
          {[0, 1, 2].map((i) => (
            <span key={i} className="flex flex-col gap-0.5">
              <span className="bg-accent/60 block h-1 w-1 rounded-full" />
              <span className="bg-text/25 block h-full rounded-sm" />
            </span>
          ))}
        </div>
      );

    // Izmenične vrstice: slika levo, nato desno.
    case "jedi":
      return (
        <div className={cn(okvir, "flex flex-col gap-1")}>
          <span className="flex h-1/2 gap-1">
            <span className="bg-text/70 block w-1/2 rounded-sm" />
            <span className="flex w-1/2 flex-col justify-center gap-0.5">
              <Crta w="w-full" />
              <Crta w="w-2/3" />
            </span>
          </span>
          <span className="flex h-1/2 gap-1">
            <span className="flex w-1/2 flex-col justify-center gap-0.5">
              <Crta w="w-full" />
              <Crta w="w-2/3" />
            </span>
            <span className="bg-text/70 block w-1/2 rounded-sm" />
          </span>
        </div>
      );

    // Tri kartice z zvezdicami.
    case "mnenja":
      return (
        <div className={cn(okvir, "grid grid-cols-3 gap-1")}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="border-border bg-surface flex flex-col gap-0.5 rounded-sm border p-0.5"
            >
              <span className="bg-accent-3 block h-0.5 w-3 rounded-full" />
              <Crta w="w-full" />
            </span>
          ))}
        </div>
      );

    // Pas z vpisnim poljem.
    case "novicnik":
      return (
        <div
          className={cn(okvir, "flex flex-col items-center justify-center gap-1 px-1.5")}
        >
          <Crta w="w-9" temna />
          <span className="flex w-full items-center gap-0.5">
            <span className="border-border bg-surface block h-2 flex-1 rounded-sm border" />
            <span className="bg-accent block h-2 w-3 rounded-sm" />
          </span>
        </div>
      );

    default:
      return (
        <div className={cn(okvir, "flex flex-col justify-center gap-1 px-1.5")}>
          <Crta w="w-full" temna />
          <Crta w="w-3/4" />
        </div>
      );
  }
}
