"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { zabeleziOgled } from "@/lib/analytics/actions";
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
// 2. ADMIN SE NE ŠTEJE. Svojih obiskov ne želim med številkami — sicer je
//    polovica obiska to, da sem sam pogledal, ali stran dela.
// 3. ČAKA NA MIR. Zapis gre po `requestIdleCallback`, torej šele, ko je
//    stran izrisana. Obiskovalec ne sme čakati niti milisekunde na statistiko.
//
// Komponenta ne izriše ničesar.
// ============================================================================

export function Beleznik() {
  const pot = usePathname();
  const zadnja = useRef<string | null>(null);

  useEffect(() => {
    if (!pot || zadnja.current === pot) return;
    if (pot.startsWith("/admin") || pot.startsWith("/prijava")) return;
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

  return null;
}
