"use client";

import { useRef, type ElementType, type ReactNode } from "react";

import { gsap, ScrollTrigger, useGSAP } from "@/components/motion/gsap/register";
import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { DUR, EASE, STAGGER } from "@/components/motion/tokens";
import { cn } from "@/lib/utils";

// ============================================================================
// <BatchReveal /> — odseki vstopijo, ko prideš do njih
// ----------------------------------------------------------------------------
// Ena komponenta za vso javno stran. Otroci se ob drsenju dvignejo in
// pojavijo; tisti, ki pridejo v vidno polje v isti sapi, gredo skupaj z
// zamikom 80 ms — ne vsak zase, sicer se pri mreži kartic zgodi dvanajst
// ločenih animacij namesto ene.
//
// Motor je `ScrollTrigger.batch`, kot pravi standard §9: isti sprožilci kot
// za parallax in vse drugo, kar se veže na položaj drsnika, in isti takt kot
// Lenis. Dva različna motorja za drsenje na isti strani bi pomenila dvoje
// meritev, ki se ne poznata.
//
// TRI PRAVILA, KI SO TU BISTVENA:
//
// 1. RAZKRIJE SE ENKRAT. Ko je element enkrat notri, ga nehamo opazovati.
//    Odsek, ki se ob vsakem drsenju gor in dol znova pojavi, ni več učinek,
//    ampak motnja.
//
// 2. Začetno stanje postavi GSAP, NE strežnik. Če se JavaScript ne naloži
//    ali pade, je vsebina vidna — ker v HTML-u ni `opacity: 0`. To je
//    razlika med »animacija ni delovala« in »strani ni«.
//
// 3. VAROVALO: če opazovalec ne sproži — zavihek v ozadju, napaka
//    brskalnika — se po treh sekundah vsebina preprosto pokaže. Najslabši
//    možni izid je »animacija se ni zgodila«, nikoli »strani ni«.
//
// 4. Kdor ima v sistemu zmanjšano gibanje, ne dobi NIČESAR — vsebina je
//    takoj na svojem mestu. Premik je tisti, ki pri občutljivih ljudeh
//    povzroča slabost, in 150 ms zatemnitve ne prinese ničesar, kar bi bilo
//    vredno tveganja.
//
// `start: "top 88%"` pomeni, da se odsek prebudi, ko je njegov vrh 12 %
// nad spodnjim robom zaslona — dovolj zgodaj, da je animacija
// končana, preden gost do njega res pride.
// ============================================================================

export function BatchReveal({
  children,
  as: Tag = "div",
  className,
  /** Kaj se animira; privzeto neposredni otroci. */
  izbirnik,
}: {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  izbirnik?: string;
}) {
  const koren = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const vozlisce = koren.current;
      if (!vozlisce) return;

      const elementi = izbirnik
        ? gsap.utils.toArray<HTMLElement>(izbirnik, vozlisce)
        : (Array.from(vozlisce.children) as HTMLElement[]);
      if (elementi.length === 0) return;

      // Brez opazovalca (zelo star brskalnik) naj vsebina preprosto stoji.
      if (prefersReducedMotion()) return;

      // SKRIJEMO SAMO TISTO, KAR JE POD PREGIBOM. Kar je ob nalaganju že na
      // zaslonu, ostane vidno: sicer bi se prva stvar, ki jo gost pogleda,
      // najprej zatemnila in šele nato prišla nazaj.
      //
      // Skrivamo tudi le, kadar je zavihek RES viden. `IntersectionObserver`
      // v skritem zavihku ne sproži ničesar — kdor odpre povezavo v ozadju
      // in pride nanjo čez minuto, bi našel prazno stran.
      const vidnaStran =
        typeof document === "undefined" || document.visibilityState === "visible";
      if (!vidnaStran) return;

      const visina = window.innerHeight;
      const skriti = elementi.filter((el) => el.getBoundingClientRect().top > visina);
      if (skriti.length === 0) return;

      gsap.set(skriti, { opacity: 0, y: 24 });

      /** Pokaži vse, kar je še skrito — brez animacije. */
      const razkrijVse = () => {
        gsap.set(skriti, { clearProps: "opacity,transform" });
      };

      // VAROVALO. Če opazovalec iz katerega koli razloga ne sproži (zavihek
      // v ozadju, napaka v brskalniku, stran, ki se med nalaganjem prestavi),
      // se vsebina po treh sekundah preprosto pokaže. Najslabši možni izid
      // je »animacija se ni zgodila«, nikoli »strani ni«.
      const varovalo = window.setTimeout(razkrijVse, 3000);

      // `batch` zbere vse, ki vstopijo v istem trenutku, in jih požene kot
      // eno skupino z zamikom — ne vsakega s svojim sprožilcem.
      const sprozilci = ScrollTrigger.batch(skriti, {
        once: true,
        start: "top 88%",
        onEnter: (kos) => {
          window.clearTimeout(varovalo);
          gsap.to(kos, {
            opacity: 1,
            y: 0,
            duration: DUR.base,
            ease: EASE.out,
            stagger: STAGGER,
            overwrite: true,
          });
        },
      });

      return () => {
        window.clearTimeout(varovalo);
        for (const s of sprozilci) s.kill();
      };
    },
    { scope: koren, dependencies: [izbirnik] },
  );

  return (
    <Tag ref={koren} className={cn(className)}>
      {children}
    </Tag>
  );
}
