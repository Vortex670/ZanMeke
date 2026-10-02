"use client";

import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Edino mesto registracije GSAP (standard §9.2). Komponente uvažajo `gsap`
 * in `useGSAP` OD TOD, nikoli iz `gsap` neposredno — tako je registracija
 * zagotovljena in jedro je v enem samem deljenem kosu.
 *
 * `ScrollTrigger` je registriran, ker ga zahteva standard §9 in ker ga
 * dogovorjeni nabor animacij res potrebuje: vstopi odsekov, parallax slik
 * in vse, kar se veže na položaj drsnika. `IntersectionObserver` zna samo
 * »je notri ali ni« — parallaxa, ki teče Z drsenjem, ne zna.
 *
 * Nekaj časa ga tu ni bilo, ker ga ni uporabljala nobena komponenta in se
 * je prenašal za nič. To je bil argument proti mrtvemu vtičniku, ne proti
 * animacijam.
 *
 * `Flip` in `SplitText` ostajata zunaj: kadar ju kdo res potrebuje, ju
 * dodaj sem — ne prej.
 *
 * Statični uvoz je varen v SSR-ju: GSAP se brez `window` ne dotakne DOM-a,
 * `useGSAP` pa na strežniku pade nazaj na `useEffect`.
 */
gsap.registerPlugin(useGSAP, ScrollTrigger);

export { gsap, ScrollTrigger, useGSAP };
