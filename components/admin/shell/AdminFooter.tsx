import { STRAN } from "@/lib/podatki";

/**
 * Noga administracije — tanka vrstica pod vsebino.
 *
 * Živa pika levo pove, da je to delujoč sistem in ne posnetek; desno stoji
 * domena in različica. Ko kaj ne dela, je prvo vprašanje vedno »katera
 * različica teče« — tu je odgovor, brez brskanja.
 */
export function AdminFooter({ razlicica }: { razlicica?: string }) {
  return (
    <footer className="border-chrome-line type-micro text-subtle mt-auto flex flex-wrap items-center gap-x-(--s2) gap-y-1 border-t px-(--s2) py-(--s2)">
      <span className="inline-flex items-center gap-2">
        <span aria-hidden className="bg-success size-1.5 rounded-full" />
        ADMIN PANEL
      </span>
      <span>
        © {new Date().getFullYear()} {STRAN.ime}
      </span>
      <span className="ml-auto tabular-nums">
        {STRAN.domena}
        {razlicica ? ` · ${razlicica}` : ""}
      </span>
    </footer>
  );
}
