"use client";

import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

import {
  ADMIN_SIDEBAR_SURFACE,
  CHROME_PILL,
  CHROME_PILL_ICON,
} from "@/components/admin/chrome";
import { gsap } from "@/components/motion/gsap/register";
import { DUR, EASE } from "@/components/motion/tokens";
import { usePresence } from "@/components/motion/use-presence";
import { cn } from "@/lib/utils";
import { Pressable } from "@/components/ui/Pressable";
import { STRAN } from "@/lib/podatki";

type Props = {
  /** a11y label za hamburger + drawer dialog. */
  openLabel: string;
  /** a11y label za backdrop gumb (klik zapre). */
  closeLabel: string;
  /** Vsebina drawer-ja — običajno `<AdminSidebarNav />` iz server layouta. */
  children?: React.ReactNode;
};

/**
 * AdminMobileNav — hamburger (48 px pill) + slide-in drawer Z LEVE
 * (1:1 zanmeke `AdminMobileDrawer`, sept 2026). Skrit na `md+`.
 *
 *   • Backdrop `bg-bg/60 backdrop-blur-md` (fade `DUR.fast`), klik zapre.
 *   • Panel `w-72`, drsi z leve (`xPercent` -100 → 0, `DUR.base`,
 *     `EASE.out`; usePresence ohrani element med izhodom), border-r +
 *     `--shadow-drawer`. Brez X gumba — zapre backdrop klik, Escape ali
 *     navigacija (pathname change). Reduced motion → samo zatemnitev.
 *   • Otrok = `<AdminSidebarNav />` (ista vsebina kot desktop aside); panel
 *     nosi `ADMIN_SIDEBAR_SURFACE` (1:1 zanmeke `AdminMobileDrawer`).
 *
 * **Portal pattern (KRITIČNO):** AdminTopbar ima `backdrop-blur-md`, kar
 * ustvari lasten stacking context. Če bi drawer renderjali kot otroka
 * headerja, bi `fixed inset-0` ostal ujet v z-(--z-sticky) → main bi bil
 * viden čez backdrop. Zato `createPortal(…, document.body)`.
 */
export function AdminMobileNav({ openLabel, closeLabel, children }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const { mounted: drawerMounted, ref: drawerRef } = usePresence<HTMLDivElement>(open, {
    enter: (el) => {
      const q = gsap.utils.selector(el);
      return gsap
        .timeline()
        .fromTo(
          q("[data-drawer-backdrop]"),
          { opacity: 0 },
          { opacity: 1, duration: DUR.fast },
          0,
        )
        .fromTo(
          q("[data-drawer-panel]"),
          { xPercent: -100 },
          { xPercent: 0, duration: DUR.base, ease: EASE.out },
          0,
        );
    },
    exit: (el) => {
      const q = gsap.utils.selector(el);
      return gsap
        .timeline()
        .to(q("[data-drawer-backdrop]"), { opacity: 0, duration: DUR.fast }, 0)
        .to(
          q("[data-drawer-panel]"),
          { xPercent: -100, duration: DUR.base, ease: EASE.out },
          0,
        );
    },
  });

  // Portal mount gate — `document.body` na strežniku ne obstaja.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const [prevPathname, setPrevPathname] = useState<string | null>(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <Pressable
        onClick={() => setOpen(true)}
        aria-label={openLabel}
        aria-expanded={open}
        aria-controls="admin-mobile-drawer"
        className={cn(CHROME_PILL, CHROME_PILL_ICON, "lg:hidden")}
      >
        <Menu strokeWidth={1.7} aria-hidden />
      </Pressable>

      {mounted &&
        drawerMounted &&
        createPortal(
          <div
            ref={drawerRef}
            className="fixed inset-0 z-(--z-modal) h-dvh w-screen lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label={openLabel}
            id="admin-mobile-drawer"
          >
            {/* Backdrop — klik zapre. */}
            <Pressable
              aria-label={closeLabel}
              onClick={() => setOpen(false)}
              data-drawer-backdrop
              className="bg-bg/60 absolute inset-0 backdrop-blur-md"
            />

            {/* Panel — drsi z leve. */}
            <div
              data-drawer-panel
              className={cn(
                "border-chrome-line absolute top-0 bottom-0 left-0 flex h-dvh w-72 flex-col border-r shadow-(--shadow-drawer)",
                ADMIN_SIDEBAR_SURFACE,
              )}
              style={{
                paddingTop: "env(safe-area-inset-top)",
                paddingLeft: "env(safe-area-inset-left)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* GLAVA PREDALA. Prej je predal odprl gol seznam povezav:
                  brez imena strani in brez gumba za zapiranje, torej brez
                  vsakršnega znaka, kje si in kako nazaj. Na namizju to vlogo
                  opravi vrhnja vrstica, v predalu pa je ni bilo nič. */}
              <div className="border-chrome-line flex h-14 shrink-0 items-center justify-between gap-2 border-b px-3">
                <span className="type-eyebrow text-text truncate tracking-[0.2em]">
                  {STRAN.domena.toUpperCase()}
                </span>
                <Pressable
                  onClick={() => setOpen(false)}
                  aria-label={closeLabel}
                  className={cn(CHROME_PILL, CHROME_PILL_ICON)}
                >
                  <X strokeWidth={1.7} aria-hidden />
                </Pressable>
              </div>

              {children}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
