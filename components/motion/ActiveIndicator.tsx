"use client";

import { useRef } from "react";

import { cn } from "@/lib/utils";

import { gsap, useGSAP } from "./gsap/register";
import { prefersReducedMotion } from "./reduced-motion";
import { DUR, EASE } from "./tokens";

/**
 * ActiveIndicator — absolutno pozicionirana pilula, ki se z `gsap.to`
 * (x, width) premakne na aktivni čip (nadomestek `layoutId`, standard §9.2).
 *
 * Uporaba: starš je `relative`, čipi nosijo `data-indicator-key="<ključ>"`
 * in so `relative` (izrisani NAD pilulo, ki je prvi otrok):
 *
 *   <div className="relative inline-flex …">
 *     <ActiveIndicator activeKey={current} className="rounded-full bg-text" />
 *     {options.map((o) => <button data-indicator-key={o.value} className="relative …" />)}
 *   </div>
 *
 * Začetni položaj se nastavi sinhrono (useGSAP = useLayoutEffect) brez
 * animacije; premik ob spremembi ključa je `DUR.base` / `EASE.out`, pri
 * `prefers-reduced-motion` skok. `ResizeObserver` ponovno poravna ob
 * spremembi širin (brez animacije).
 */
export function ActiveIndicator({
  activeKey,
  className,
}: {
  activeKey: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const first = useRef(true);

  useGSAP(
    () => {
      const el = ref.current;
      const parent = el?.parentElement;
      if (!el || !parent) return;

      const target = parent.querySelector<HTMLElement>(
        `[data-indicator-key="${CSS.escape(activeKey)}"]`,
      );
      if (!target) {
        gsap.set(el, { autoAlpha: 0 });
        return;
      }

      const place = (animate: boolean) => {
        const vars = {
          x: target.offsetLeft,
          y: target.offsetTop,
          width: target.offsetWidth,
          height: target.offsetHeight,
          autoAlpha: 1,
        };
        if (!animate || prefersReducedMotion()) {
          gsap.set(el, vars);
        } else {
          gsap.to(el, { ...vars, duration: DUR.base, ease: EASE.out, overwrite: true });
        }
      };

      place(!first.current);
      first.current = false;

      // Prvi klic opazovalca pride takoj po `observe` — preskočimo ga, da ne
      // prekine tekoče animacije; nadaljnji (resize, font swap) poravnajo brez nje.
      let initial = true;
      const ro = new ResizeObserver(() => {
        if (initial) {
          initial = false;
          return;
        }
        place(false);
      });
      ro.observe(parent);
      ro.observe(target);
      return () => ro.disconnect();
    },
    { dependencies: [activeKey] },
  );

  return (
    <span
      ref={ref}
      aria-hidden
      data-active-indicator
      className={cn("pointer-events-none invisible absolute top-0 left-0", className)}
    />
  );
}
