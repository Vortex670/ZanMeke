"use client";

import { useEffect, useRef } from "react";

import { prefersReducedMotion } from "@/components/motion/reduced-motion";
import { cn } from "@/lib/utils";

// ============================================================================
// <Ozadje3D /> — mirna svetloba za herojem
// ----------------------------------------------------------------------------
// ENA PLOSKEV in nič drugega: mehka svetloba v barvi poudarka, ki počasi
// plava. Brez mreže pik, brez plavajočih okvirjev, brez vidne geometrije.
//
// Prva različica je imela oboje in je bila videti kot ozadje iz leta 2015:
// mreža je nosila vzorec, okvirji so tekmovali z naslovom, skupaj pa sta
// delala šum tam, kjer mora biti najmočnejša poved na strani. Učinek, ki ga
// opaziš, je na uvodnem zaslonu napaka — opaziti se mora naslov.
//
// Kar ostane, je globina brez predmeta: počasno gibanje svetlobe, ki se
// odzove na kazalec. Oko ga zazna kot prostor, ne kot grafiko.
//
// SEDEM PRAVIL, DA TO NE ŠKODI STRANI:
//
// 1. three.js se NALOŽI ŠELE POTEM (`await import`). Naslov, gumb in
//    telefonska številka so na zaslonu, preden se motor začne nalagati.
// 2. ZAČNE SE, KO JE HERO VIDEN, in se USTAVI, ko ni.
// 3. USTAVI SE V SKRITEM ZAVIHKU.
// 4. `prefers-reduced-motion` ga sploh ne zažene.
// 5. Ena ploskev z dvema trikotnikoma — risanje je zastonj, vse delo opravi
//    senčilnik na grafični kartici.
// 6. `devicePixelRatio` omejen na 1,5.
// 7. Ob odstranitvi se geometrija, material in KONTEKST pospravijo. Brez
//    tega vsak prehod med stranmi pusti en WebGL kontekst za sabo in
//    brskalnik jih zapre po šestnajstem.
//
// Barva ni zapisana v kodi: prebere se iz žetona `--color-poudarek`, zato je
// v temni temi drugačna, ne da bi tu kaj popravljal.
// ============================================================================

export function Ozadje3D({ className }: { className?: string }) {
  const gostitelj = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = gostitelj.current;
    if (!el || prefersReducedMotion()) return;

    let odpovedano = false;
    let pospravi: (() => void) | undefined;

    void (async () => {
      let THREE: typeof import("three");
      try {
        THREE = await import("three");
      } catch {
        return; // Brez motorja ostane ozadje prazno — stran je cela.
      }
      if (odpovedano || !el.isConnected) return;

      let risalnik: import("three").WebGLRenderer;
      try {
        risalnik = new THREE.WebGLRenderer({
          alpha: true,
          antialias: false,
          powerPreference: "low-power",
        });
      } catch {
        return; // Brez WebGL (stara naprava, izklopljen pospešek).
      }

      const sirina = () => el.clientWidth || 1;
      const visina = () => el.clientHeight || 1;

      risalnik.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
      risalnik.setSize(sirina(), visina(), false);
      risalnik.domElement.style.width = "100%";
      risalnik.domElement.style.height = "100%";
      risalnik.domElement.style.display = "block";
      el.appendChild(risalnik.domElement);

      // Pravokotna kamera in ploskev čez ves pogled: v prizoru ni globine,
      // ki bi jo bilo treba projicirati — globino nariše senčilnik.
      const prizor = new THREE.Scene();
      const kamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

      const barva = new THREE.Color(
        getComputedStyle(el).getPropertyValue("--color-poudarek").trim() || "#0f5d4c",
      );

      const geometrija = new THREE.PlaneGeometry(2, 2);
      const material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: {
          cas: { value: 0 },
          barva: { value: barva },
          kazalec: { value: new THREE.Vector2(0, 0) },
          razmerje: { value: sirina() / visina() },
        },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.0, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          uniform float cas;
          uniform float razmerje;
          uniform vec3 barva;
          uniform vec2 kazalec;
          varying vec2 vUv;

          // Tri mehke lise, vsaka s svojim obdobjem. Trije krogi z različnimi
          // hitrostmi se nikoli ne poravnajo v vzorec — pri dveh bi se, in
          // oko bi ritem opazilo.
          float lisa(vec2 p, vec2 sredisce, float polmer) {
            float d = length(p - sredisce);
            return smoothstep(polmer, 0.0, d);
          }

          void main() {
            // Vodoravno raztegnjen prostor, da lise na širokem zaslonu
            // ostanejo okrogle in se ne sploščijo.
            vec2 p = vec2(vUv.x * razmerje, vUv.y);

            // Odziv na kazalec je bil tako majhen (0,06), da ga ni nihče
            // opazil — svetloba se je premaknila za nekaj pikslov. Pri 0,16
            // se vidi, da se ozadje odzove, in pri tem še vedno ne vleče
            // pogleda z naslova.
            vec2 k = kazalec * 0.16;

            float s = 0.0;
            s += lisa(p, vec2(razmerje * 0.72 + sin(cas * 0.07) * 0.10 + k.x,
                              0.62 + cos(cas * 0.09) * 0.07 + k.y), 0.52) * 0.85;
            s += lisa(p, vec2(razmerje * 0.86 + cos(cas * 0.05) * 0.12 - k.x,
                              0.28 + sin(cas * 0.06) * 0.09 - k.y), 0.44) * 0.55;
            s += lisa(p, vec2(razmerje * 0.55 + sin(cas * 0.04 + 2.0) * 0.08,
                              0.88 + cos(cas * 0.05 + 1.0) * 0.05), 0.38) * 0.35;

            // Drugi koren zmehča rob lise; brez njega ima vsaka vidno mejo.
            s = pow(clamp(s, 0.0, 1.0), 1.6);

            // Počasno dihanje — svetloba se v desetih sekundah okrepi in
            // spet umiri. Brez tega je slika mirujoča in se ne loči od
            // navadnega prelива.
            float dih = 0.86 + 0.14 * sin(cas * 0.22);

            // 0,30 je bilo premalo, da bi se sploh videlo, da je tam tretja
            // os. 0,42 je meja, pri kateri svetloba še ne tekmuje z belim
            // naslovom nad njo — pravilo 60/30/10 velja tudi za svetlobo.
            gl_FragColor = vec4(barva, s * 0.42 * dih);
          }
        `,
      });

      const ploskev = new THREE.Mesh(geometrija, material);
      prizor.add(ploskev);

      const kazalecCilj = new THREE.Vector2(0, 0);
      const naKazalec = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        kazalecCilj.set(
          ((e.clientX - r.left) / r.width - 0.5) * 2,
          -((e.clientY - r.top) / r.height - 0.5) * 2,
        );
      };
      window.addEventListener("pointermove", naKazalec, { passive: true });

      // ── Zanka, ki teče samo kadar je smiselno (pravili 2 in 3) ──────────
      let kadr = 0;
      let tece = false;
      let viden = true;
      let zavihekViden = document.visibilityState === "visible";
      let zacetek = performance.now();

      const izris = () => {
        kadr = requestAnimationFrame(izris);
        material.uniforms.cas.value = (performance.now() - zacetek) / 1000;
        const u = material.uniforms.kazalec.value as import("three").Vector2;
        // Hitreje kot prej (0,03): pri tako počasnem sledenju se zdi, da se
        // svetloba na kazalec ne odziva, ampak samo plava sama zase.
        u.lerp(kazalecCilj, 0.06);
        risalnik.render(prizor, kamera);
      };

      const preveri = () => {
        const naj = viden && zavihekViden;
        if (naj && !tece) {
          tece = true;
          // Ura teče naprej od tam, kjer se je ustavila: brez tega svetloba
          // ob vrnitvi v zavihek poskoči za toliko, kolikor je bil skrit.
          zacetek = performance.now() - material.uniforms.cas.value * 1000;
          kadr = requestAnimationFrame(izris);
        } else if (!naj && tece) {
          tece = false;
          cancelAnimationFrame(kadr);
        }
      };

      const opazovalec = new IntersectionObserver(
        ([vnos]) => {
          viden = vnos?.isIntersecting ?? false;
          preveri();
        },
        { rootMargin: "100px" },
      );
      opazovalec.observe(el);

      const naZavihek = () => {
        zavihekViden = document.visibilityState === "visible";
        preveri();
      };
      document.addEventListener("visibilitychange", naZavihek);

      const naVelikost = () => {
        risalnik.setSize(sirina(), visina(), false);
        material.uniforms.razmerje.value = sirina() / visina();
      };
      const merilec = new ResizeObserver(naVelikost);
      merilec.observe(el);

      // Prvi kader narišemo takoj — kdor odpre povezavo v zavihku v ozadju,
      // ima ob prihodu nanj sliko in ne praznine.
      risalnik.render(prizor, kamera);
      preveri();

      pospravi = () => {
        cancelAnimationFrame(kadr);
        opazovalec.disconnect();
        merilec.disconnect();
        document.removeEventListener("visibilitychange", naZavihek);
        window.removeEventListener("pointermove", naKazalec);
        geometrija.dispose();
        material.dispose();
        risalnik.dispose(); // pravilo 7 — sprosti kontekst
        risalnik.domElement.remove();
      };
    })();

    return () => {
      odpovedano = true;
      pospravi?.();
    };
  }, []);

  return (
    <div
      ref={gostitelj}
      aria-hidden
      // Prehoden za klike: pod njim so naslov in gumbi.
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    />
  );
}
