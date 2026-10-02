import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";

import { FOCUS_RING } from "@/components/ui/Pressable";
import { cn } from "@/lib/utils";

/**
 * IconButton — kvadraten/okrogel gumb samo z ikono; `label` je obvezen.
 *
 * Ista datoteka (API, variante, mere) kot zanmeke.com
 * `components/ui/IconButton.tsx` — razlika so samo imena barvnih žetonov.
 *
 * Za inline akcije (počisti iskanje, zapri modal, kopiraj, odstrani vrstico).
 * NE uporabljaj za primarne CTA-je — tam gre `<Button>`.
 *
 * Variante: `ghost` · `subtle` · `primary` · `pill` (frosted chrome pilula
 * iz `components/admin/chrome.ts`, pari s `size="lg"` = 48 px).
 * Velikosti: `sm` (32) · `md` (40) · `lg` (48).
 */

type IconButtonVariant = "ghost" | "subtle" | "primary" | "pill";
type IconButtonSize = "sm" | "md" | "lg";

type IconButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children"> & {
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  /** aria-label za bralnike zaslona — brez vidnega besedila je OBVEZEN. */
  label: string;
  children: ReactNode;
};

const VARIANT_CLASSES: Record<IconButtonVariant, string> = {
  ghost:
    "rounded-full bg-transparent text-muted hover:bg-surface hover:text-text disabled:opacity-50 disabled:hover:bg-transparent",
  subtle: "rounded-full bg-surface text-text hover:bg-surface-2 disabled:opacity-50",
  primary:
    "rounded-full bg-accent text-accent-fg hover:bg-accent-hover disabled:opacity-60",
  pill: "rounded-full bg-surface/70 ring-border/60 ring-1 backdrop-blur-sm shadow-(--shadow-glass) text-text/80 hover:bg-surface hover:ring-border-strong/80 hover:text-text transition-all",
};

const SIZE_CLASSES: Record<IconButtonSize, string> = {
  // 44 px na dotik, 32 z miško — glej isto opombo v `Button.tsx`.
  // `sm` nosi orodno vrstico urejevalnika besedila in glave blokov, kjer
  // je gumb za brisanje 2 px od gumba za premik.
  sm: "size-11 [&_svg]:size-4 sm:size-8 sm:[&_svg]:size-3.5",
  // 44 px na dotik, 40 z miško — playbook, str. 29–33 in anti-vzorec na
  // str. 287 (»navpični razmaknine < 44 px za dotične elemente«).
  // `md` nosijo števci količine, koši za odstranitev in podobna dejanja,
  // ki se zadenejo enkrat in morajo biti prava tarča.
  md: "size-11 [&_svg]:size-4 sm:size-10",
  lg: "size-12 [&_svg]:size-[18px]",
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    {
      variant = "ghost",
      size = "md",
      label,
      type = "button",
      className,
      children,
      disabled,
      ...rest
    },
    ref,
  ) {
    return (
      <button
        ref={ref}
        type={type}
        aria-label={label}
        disabled={disabled}
        className={cn(
          "inline-flex shrink-0 items-center justify-center outline-hidden transition-colors",
          FOCUS_RING.outside,
          "disabled:cursor-not-allowed",
          VARIANT_CLASSES[variant],
          SIZE_CLASSES[size],
          className,
        )}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
