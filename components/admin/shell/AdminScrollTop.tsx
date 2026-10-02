"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

// ============================================================================
// <AdminScrollTop> — vsaka admin stran se odpre na vrhu.
// ----------------------------------------------------------------------------
// V adminu ne drsi okno, ampak `<main>` (shell je `fixed inset-0`). Brskalnik
// ob osvežitvi obnovi odmik takega vsebnika, Next pa ob prehodu med potmi
// postavi na vrh samo OKNO — zato je stran ostala na starem odmiku in je glava
// (drobtine, nadnaslov, naslov) obtičala pod lebdečo zgornjo vrstico.
//
// Ista datoteka na obeh projektih.
// ============================================================================

export function AdminScrollTop({ targetId = "admin-main" }: { targetId?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    // `auto`, ne `smooth`: ob menjavi strani ne želimo animacije drsenja.
    el.scrollTo({ top: 0, behavior: "auto" });
  }, [pathname, targetId]);

  return null;
}
