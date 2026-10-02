// ============================================================================
// <CrtaNapredka /> — koliko strani je še
// ----------------------------------------------------------------------------
// Dva piksla debela črta na vrhu okna, ki raste z drsenjem. Edini okras, ki
// pove nekaj uporabnega: koliko je še do konca. Na dolgi strani je to razlika
// med branjem in ugibanjem, ali se splača drseti naprej.
//
// BREZ JAVASCRIPTA. Prej je bila tu odjemalska komponenta z GSAP-ovim
// `ScrollTrigger`: poslušalec drsenja in klic ob vsakem kadru na glavni niti.
// Zdaj to opravi `animation-timeline: scroll()` v `app/globals.css` — animacija
// teče na nitki za sestavljanje, se ne tepe z drsenjem in ne stane niti
// bajta naloženega.
//
// Risanje je s `scaleX` in ne s `width`: širina sproži preračun postavitve ob
// vsakem kadru, `scaleX` pa teče na grafični kartici.
//
// `prefers-reduced-motion` je upoštevan v `globals.css`, kjer so vse
// animacije skrajšane na nič.
// ============================================================================

export function CrtaNapredka() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5">
      <div className="crta-napredka bg-poudarek h-full w-full" />
    </div>
  );
}
