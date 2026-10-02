import { cn } from "@/lib/utils";

// ============================================================================
// <NaslovOdseka /> — oznaka, naslov, uvod
// ----------------------------------------------------------------------------
// Vsak odsek na vsaki javni strani se začne enako: številka in oznaka v
// drobni pisavi, naslov, pod njim en odstavek. Vedno isti razmiki, vedno ista
// širina besedila.
//
// To ni enoličnost, ampak bralni ritem: oko se nauči, kje se odsek začne, in
// od tretjega naprej ga ne išče več. Strani, ki vsak odsek postavijo drugače,
// so videti bogate — in se berejo kot kup letakov.
//
// Širina besedila je omejena z `.mera` (okoli 65 znakov). Daljša vrstica se
// bere počasneje, ker oko ob vrnitvi na levi rob zgreši vrstico.
// ============================================================================

export function NaslovOdseka({
  stevilka,
  oznaka,
  naslov,
  uvod,
  /** Na temni ploskvi so tišja besedila drugačna. */
  naTemnem = false,
  className,
}: {
  stevilka?: number;
  oznaka: string;
  naslov: string;
  uvod?: string;
  naTemnem?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("mera", className)}>
      <p className="type-label text-poudarek flex items-center gap-2">
        {stevilka !== undefined ? (
          <span
            aria-hidden
            className={cn("stevilke", naTemnem ? "text-na-obratu/30" : "text-bledo")}
          >
            {String(stevilka).padStart(2, "0")}
          </span>
        ) : null}
        {oznaka}
      </p>
      <h2 className="type-h2 mt-s1">{naslov}</h2>
      {uvod ? (
        <p
          className={cn("type-body mt-s2", naTemnem ? "text-na-obratu/60" : "text-mirno")}
        >
          {uvod}
        </p>
      ) : null}
    </div>
  );
}
