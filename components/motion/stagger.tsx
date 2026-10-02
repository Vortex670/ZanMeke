import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Stagger + StaggerItem — seznami (apartmaji, mnenja, kartice). Strežniški
 * komponenti: CSS `animation-timeline: view()` prek `.stagger > *` v
 * `styles/base.css` (tokena `--dur-base` / `--ease-out`, `nth-child` zamik).
 * Brez JS-a; brskalniki brez podpore vsebino pokažejo takoj.
 *
 * Brez props za trajanje/prag (standard §9.2).
 */
type StaggerProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "ol";
};

export function Stagger({ children, className, as = "div" }: StaggerProps) {
  const Tag = as;
  return <Tag className={cn("stagger", className)}>{children}</Tag>;
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
  as?: "div" | "article" | "li";
};

export function StaggerItem({ children, className, as = "div" }: StaggerItemProps) {
  const Tag = as;
  // Animacija + zamik prideta iz `.stagger > *` (CSS); element sam ne
  // potrebuje dodatnih razredov.
  return <Tag className={className}>{children}</Tag>;
}
