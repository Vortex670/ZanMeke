import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * FadeIn — vstop odseka ob vstopu v pogled. Strežniška komponenta:
 * CSS `animation-timeline: view()` (`.fade-in` v `styles/base.css`,
 * tokena `--dur-base` / `--ease-out`), brez JS-a in brez opazovalcev.
 * Brskalniki brez podpore vsebino pokažejo takoj.
 *
 * Brez props za trajanje (standard §9.2) — samo `delay` (zamik) ostane.
 */
type FadeInProps = {
  children: ReactNode;
  /** Zamik animacije v sekundah (`animation-delay`). */
  delay?: number;
  className?: string;
  /** HTML oznaka — privzeto div. */
  as?: "div" | "section" | "article" | "header" | "footer" | "li";
};

export function FadeIn({ children, delay, className, as = "div" }: FadeInProps) {
  const Tag = as;
  const style = delay ? { animationDelay: `${delay}s` } : undefined;
  return (
    <Tag className={cn("fade-in", className)} style={style}>
      {children}
    </Tag>
  );
}
