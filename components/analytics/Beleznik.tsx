"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { zabeleziDogodek, zabeleziOgled } from "@/lib/analytics/actions";
import { preberiPrivolitev } from "@/lib/privolitev";

// ============================================================================
// <Beleznik /> — zapiše ogled strani
// ----------------------------------------------------------------------------
// Zakaj odjemalec in ne strežnik: ogled se mora zapisati tudi takrat, ko se
// stran odpre iz predpomnilnika brskalnika ali ko se v enem obisku zamenja
// pot brez novega zahtevka (povezava znotraj strani). Poleg tega se piškotek
// z oznako obiskovalca sme postaviti samo v strežniškem dejanju — med
// izrisom strani ga Next ne pusti.
//
// TRI VAROVALA, da to nikoli ne postane breme:
//
// 1. ENKRAT NA POT. `useRef` z zadnjo zapisano potjo: ponoven izris (tema,
//    stanje komponente) ne naredi drugega zapisa.
// 2. ADMIN IN PLAČILNE STRANI SE NE ŠTEJEJO. Svojih obiskov ne želim med
//    številkami; plačilna stran pa ima v naslovu ŽETON, ki je edini ključ
//    do tujega računa — in ta ne sme ležati v tabeli obiskov. Poleg tega je
//    vsak tak naslov enkraten, zato bi seznam najbolj gledanih strani
//    napolnil s potmi, ki se ne ponovijo nikoli več.
// 3. ČAKA NA MIR. Zapis gre po `requestIdleCallback`, torej šele, ko je
//    stran izrisana. Obiskovalec ne sme čakati niti milisekunde na statistiko.
//
// KLIC NA TELEFON SE ŠTEJE TUKAJ in ne na vsakem gumbu posebej. Telefonskih
// povezav je šest (glava, noga, plavajoči gumb, stik, kontakt, plačilna
// stran) in vsaka bi potrebovala svoj klic; sedmo bi kdo dodal in pozabil.
// Ena poslušalka na dokumentu ujame vse, tudi tiste, ki še ne obstajajo.
//
// Klic na telefon je NAJPOMEMBNEJŠA številka na tej strani: povpraševanje
// prek obrazca je v bazi vidno samo po sebi, klic pa nikjer — in prav klic
// je dejanje, ki ga stran največkrat sproži.
//
// Komponenta ne izriše ničesar.
// ============================================================================

/** Poti, ki ne spadajo v statistiko obiska. */
const NE_BELEZI = ["/admin", "/prijava", "/racun"];

export function Beleznik() {
  const pot = usePathname();
  const zadnja = useRef<string | null>(null);

  useEffect(() => {
    if (!pot || zadnja.current === pot) return;
    if (NE_BELEZI.some((x) => pot.startsWith(x))) return;
    // 4. BREZ PRIVOLITVE NI KLICA. Strežnik to preveri še enkrat, a klic,
    //    ki ne sme nič zapisati, nima zakaj oditi.
    if (preberiPrivolitev(document.cookie) !== "da") return;
    zadnja.current = pot;

    const zapisi = () => {
      void zabeleziOgled(pot, document.title);
    };

    // `requestIdleCallback` ni povsod (Safari ga je dobil pozno) — tam
    // zadošča kratek zamik, da se izris konča prvi.
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(zapisi, { timeout: 2000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(zapisi, 400);
    return () => window.clearTimeout(id);
  }, [pot]);

  // Poslušalka visi na dokumentu in ne na posameznem gumbu. `capture` zato,
  // da se dogodek ujame tudi takrat, kadar kaka komponenta klik ustavi.
  useEffect(() => {
    const naKlik = (e: MouseEvent) => {
      const cilj = e.target;
      if (!(cilj instanceof Element)) return;
      const povezava = cilj.closest('a[href^="tel:"]');
      if (!povezava) return;
      if (preberiPrivolitev(document.cookie) !== "da") return;
      void zabeleziDogodek("klic", window.location.pathname);
    };

    document.addEventListener("click", naKlik, { capture: true });
    return () => document.removeEventListener("click", naKlik, { capture: true });
  }, []);

  return null;
}
