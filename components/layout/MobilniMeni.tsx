"use client";

import { ArrowUpRight, Mail, Menu, Phone, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import { gsap } from "@/components/motion/gsap/register";
import { DUR, EASE, STAGGER } from "@/components/motion/tokens";
import { usePresence } from "@/components/motion/use-presence";
import { Znak } from "@/components/ui/Znak";
import { STRAN } from "@/lib/podatki";
import { cn } from "@/lib/utils";

// ============================================================================
// <MobilniMeni /> — navigacija na telefonu
// ----------------------------------------------------------------------------
// Prej je bila pod glavo DRUGA VRSTICA s tremi povezavami. Za tri postavke je
// to načeloma boljše od predala — vidne so brez dotika — a je stalo dvoje:
// vrstica je jemala višino prvemu zaslonu, in v njej ni bilo prostora za
// nobeno povezavo več. Predal nosi poleg treh poti še pravna besedila, klic
// in e-pošto, ki jih vrstica ne bi nikoli sprejela.
//
// Isti vzorec kot na gostilnica-plus.si in second-home.hr:
//   • predal gre skozi PORTAL na `<body>` — glava leži na heroju in vsak
//     `transform` v njej bi predal ujel v svoj koordinatni sistem;
//   • vrh predala je vrh glave v trenutku odprtja, zato se nič ne premakne;
//   • pomik se zaklene na `<html>` IN `<body>` — dokument drsi po `<html>`,
//     zato sam `body { overflow: hidden }` ne zadošča;
//   • vstop je ena GSAP časovnica prek `usePresence`, izhod zatemnitev;
//     ob `prefers-reduced-motion` ostane samo ta.
//
// Ob spremembi poti se predal zapre sam; brez tega ostane odprt čez novo
// stran, ker se komponenta v postavitvi ne odklopi.
// ============================================================================

export type MobilnaPovezava = { href: string; label: string };

export function MobilniMeni({
  povezave,
  pravne = [],
}: {
  povezave: readonly MobilnaPovezava[];
  /** Pravna besedila — drobni tisk na dnu predala. */
  pravne?: readonly MobilnaPovezava[];
}) {
  const [odprt, nastaviOdprt] = useState(false);
  const [odmikVrh, nastaviOdmik] = useState(0);
  const pot = usePathname();

  const { mounted, ref } = usePresence<HTMLDivElement>(odprt, {
    enter: (el) => {
      const q = gsap.utils.selector(el);
      return gsap
        .timeline()
        .fromTo(
          q("[data-meni-sloj]"),
          { opacity: 0 },
          { opacity: 1, duration: DUR.base, ease: EASE.out },
          0,
        )
        .fromTo(
          q("[data-meni-vnos]"),
          { opacity: 0, x: 24 },
          {
            opacity: 1,
            x: 0,
            duration: DUR.base,
            ease: EASE.out,
            stagger: STAGGER,
          },
          STAGGER,
        );
    },
    exit: (el) =>
      gsap.to(gsap.utils.selector(el)("[data-meni-sloj]"), {
        opacity: 0,
        duration: DUR.base,
        ease: EASE.out,
      }),
  });

  // Portal sme nastati šele v brskalniku; na strežniku `document` ni.
  const portalPripravljen = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // Zapri ob prehodu na drugo stran (vzorec React 19: setState med izrisom).
  const [prejsnjaPot, nastaviPrejsnjo] = useState<string | null>(pot);
  if (prejsnjaPot !== pot) {
    nastaviPrejsnjo(pot);
    if (odprt) nastaviOdprt(false);
  }

  useEffect(() => {
    if (!odprt) return;
    const naTipko = (e: KeyboardEvent) => e.key === "Escape" && nastaviOdprt(false);
    document.addEventListener("keydown", naTipko);
    return () => document.removeEventListener("keydown", naTipko);
  }, [odprt]);

  useEffect(() => {
    if (!odprt) return;
    const html = document.documentElement;
    const prejBody = document.body.style.overflow;
    const prejHtml = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prejBody;
      html.style.overflow = prejHtml;
    };
  }, [odprt]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => {
          const vrhGlave =
            document.querySelector("header")?.getBoundingClientRect().top ?? 0;
          nastaviOdmik(Math.max(0, Math.round(vrhGlave)));
          nastaviOdprt((v) => !v);
        }}
        aria-label={odprt ? "Zapri meni" : "Odpri meni"}
        aria-expanded={odprt}
        aria-controls="mobilni-meni"
        className="text-na-obratu hover:bg-na-obratu/10 relative inline-flex size-11 items-center justify-center rounded-full transition-colors"
      >
        <span className="relative inline-flex size-6 items-center justify-center">
          <Menu
            aria-hidden
            strokeWidth={1.8}
            className={cn(
              "absolute size-6 transition-all duration-(--dur-fast)",
              odprt ? "rotate-90 opacity-0" : "rotate-0 opacity-100",
            )}
          />
          <X
            aria-hidden
            strokeWidth={1.8}
            className={cn(
              "absolute size-6 transition-all duration-(--dur-fast)",
              odprt ? "rotate-0 opacity-100" : "-rotate-90 opacity-0",
            )}
          />
        </span>
      </button>

      {portalPripravljen && mounted
        ? createPortal(
            // Koren brez lastne postavitve (otroka sta `fixed`) — nosi ref
            // za `usePresence` in obseg selektorjev časovnice.
            <div ref={ref}>
              <div
                aria-hidden
                data-meni-sloj
                className="plast-temna bg-papir/95 fixed inset-x-0 bottom-0 z-(--z-modal) backdrop-blur-xl"
                style={{ top: odmikVrh }}
              />

              <div
                id="mobilni-meni"
                role="dialog"
                aria-modal="true"
                aria-label="Meni"
                data-meni-sloj
                className="plast-temna fixed inset-x-0 bottom-0 z-(--z-modal) flex w-full max-w-[100vw] flex-col"
                style={{
                  top: odmikVrh,
                  height: `calc(100dvh - ${odmikVrh}px)`,
                  paddingLeft: "env(safe-area-inset-left)",
                  paddingRight: "env(safe-area-inset-right)",
                }}
              >
                <div className="flex h-16 shrink-0 items-center justify-between px-4">
                  <span className="gap-s1 flex items-center">
                    <Znak className="text-poudarek size-6" />
                    <span className="font-oznaka text-crnilo text-[0.95rem] font-semibold tracking-[0.18em]">
                      ŽAN MEKE
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => nastaviOdprt(false)}
                    aria-label="Zapri meni"
                    className="text-crnilo hover:bg-crnilo/5 inline-flex size-11 items-center justify-center rounded-full transition-colors"
                  >
                    <X className="size-6" strokeWidth={1.8} aria-hidden />
                  </button>
                </div>

                <nav
                  aria-label="Glavna"
                  className="flex flex-1 flex-col overflow-y-auto px-4"
                >
                  {povezave.map((p, i) => (
                    <Link
                      key={p.href}
                      href={p.href}
                      data-meni-vnos
                      className="border-crta-mehka text-crnilo hover:text-poudarek py-s3 flex items-baseline gap-3 border-b text-2xl font-medium transition-colors"
                    >
                      <span className="text-bledo stevilke font-mono text-xs">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      {p.label}
                    </Link>
                  ))}

                  {/* Pravna besedila so v predalu in ne v glavnem seznamu:
                      nihče jih ne išče, a morajo biti dosegljiva z vsake
                      strani — in na telefonu je noga daleč. */}
                  {pravne.length > 0 ? (
                    <div data-meni-vnos className="gap-s2 mt-s3 flex flex-wrap pb-(--s2)">
                      {pravne.map((p) => (
                        <Link
                          key={p.href}
                          href={p.href}
                          className="type-micro text-bledo hover:text-mirno transition-colors"
                        >
                          {p.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </nav>

                {/* Klic in e-pošta sta na dnu, pod palcem, in ne med
                    povezavami: to sta dejanji, zaradi katerih ta stran
                    stoji, in nista isto kot pot do podstrani. */}
                <div
                  data-meni-vnos
                  className="border-crta gap-s1 flex shrink-0 flex-col border-t p-4"
                  style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
                >
                  <a
                    href={`tel:${STRAN.telefonKlic}`}
                    className="bg-poudarek text-na-poudarku inline-flex h-12 items-center justify-center gap-2 rounded-md font-medium transition-opacity hover:opacity-90"
                  >
                    <Phone className="size-4" aria-hidden />
                    <span className="stevilke">{STRAN.telefon}</span>
                  </a>
                  <a
                    href={`mailto:${STRAN.epota}`}
                    className="border-crta text-crnilo hover:border-poudarek inline-flex h-12 items-center justify-center gap-2 rounded-md border transition-colors"
                  >
                    <Mail className="size-4" aria-hidden />
                    {STRAN.epota}
                    <ArrowUpRight className="size-4" aria-hidden />
                  </a>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
