import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * IconCircle — ikona v krogu (medaljon). Ni klikljiv; za klikljivo ikono je
 * `IconButton`.
 *
 * Ta krog stoji ob naslovu odseka, v vrstici s podatkom, nad sporočilom o
 * uspehu in v kartici dejstva — **27 mest** je geometrijo pisalo na roko
 * (`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full`),
 * ob njej pa še vsako svojo sestavo barv. Zato sta se prikradli dve meri
 * (40 in 44 px) in pet različnih jakosti iste accent podlage
 * (`/10` · `/12` · `/15`, z obročem in brez).
 *
 * `size`: `xs` = 32 px (drobni tisk, opombe pod vsebino) · `sm` = 40 px
 * (odseki admina, gostejše vrstice) · `md` = 44 px (javna stran, dotikovni
 * cilj po playbooku).
 *
 * `shape`: `circle` (privzeto) · `square` — zaobljen kvadrat. Kvadrat je za
 * oznake, ki stojijo v vrsti ena ob drugi in nosijo besedilo ob sebi
 * (opombe, legenda): krog ob besedilu bere kot gumb, kvadrat kot znak.
 *
 * `tone`:
 *   - `accent` — accent podlaga z obročem; privzeti medaljon.
 *   - `accent-solid` — polna accent ploskev (korak v čarovniku, potrditev).
 *   - `success` · `warning` · `danger` — stanje.
 *   - `neutral` — pogreznjena ploskev brez pomena (nadomestna ikona).
 *   - `outline` — samo obroba (drugotni medaljon ob povezavi).
 *   - `none` — brez barve; ton poda klicatelj skozi `className`, kadar ga
 *     izračuna iz podatkov (npr. barva mape v arhivu).
 *
 * ```tsx
 * <IconCircle tone="accent"><MapPin className="h-5 w-5" /></IconCircle>
 * ```
 */

type IconCircleSize = "xs" | "sm" | "md";
type IconCircleShape = "circle" | "square";
type IconCircleTone =
  | "accent"
  | "accent-solid"
  | "success"
  | "warning"
  | "danger"
  | "neutral"
  | "outline"
  | "none";

const SIZE: Record<IconCircleSize, string> = {
  xs: "h-8 w-8",
  sm: "h-10 w-10",
  md: "h-11 w-11",
};

/** Polmer se ravna po velikosti: `rounded-lg` na 32 px je že skoraj krog. */
const SHAPE: Record<IconCircleShape, string> = {
  circle: "rounded-full",
  square: "rounded-md",
};

const TONE: Record<IconCircleTone, string> = {
  accent: "bg-accent/10 text-accent ring-accent/20 ring-1",
  "accent-solid": "bg-accent text-accent-fg",
  success: "bg-success/10 text-success ring-success/20 ring-1",
  warning: "bg-warning-bg text-warning-fg ring-warning/20 ring-1",
  danger: "bg-danger/10 text-danger ring-danger/20 ring-1",
  neutral: "bg-surface-2 text-subtle",
  outline: "border-border/70 text-text border",
  none: "",
};

export function IconCircle({
  children,
  size = "md",
  shape = "circle",
  tone = "accent",
  className,
}: {
  children: ReactNode;
  size?: IconCircleSize;
  shape?: IconCircleShape;
  tone?: IconCircleTone;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        SHAPE[shape],
        SIZE[size],
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
