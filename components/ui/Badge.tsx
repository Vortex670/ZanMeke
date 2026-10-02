import { forwardRef, type HTMLAttributes, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Badge — mala oznaka za status, kategorijo, feature tag.
 *
 * Ista datoteka (API, mere, variante) kot zanmeke.com
 * `components/ui/Badge.tsx` — razlika so samo imena barvnih žetonov.
 *
 * **Variante**:
 *   - `neutral` (= `default`): obrobljen chip — privzeto ("Osnutek", "Arhiv")
 *   - `success`: green (za "Na voljo", "Plačano", "Potrjeno")
 *   - `warning`: amber (za "V obravnavi", "Čaka plačilo")
 *   - `danger` (= `destructive`): red (za "Zavrnjeno", "Zasedeno")
 *   - `accent`: brand (za "Novo", "Priporočeno", feature poudarki)
 *   - `muted`: tiho polnilo (števci)
 *   - `outline`: prozorno ozadje, samo obroba
 *
 * **Size**: `xs`/`sm` (h-5) in `md` (h-6). Za večje poudarke raje uporabi Alert.
 *
 * **Sloti**:
 *   - `icon` — levi slot (npr. majhna ikona)
 *   - `dot` — bližnjica za status piko v barvi variante
 *
 *   ```tsx
 *   <Badge variant="success" dot>Na voljo</Badge>
 *   <Badge variant="accent" icon={<Sparkles className="h-3 w-3" />}>Novo</Badge>
 *   ```
 *
 * **NE uporabi za**:
 *   - Klikljive filtre (→ `FilterChips` ali `<Button variant="ghost" size="sm">`).
 */

export type BadgeVariant =
  | "neutral"
  | "default"
  | "accent"
  | "success"
  | "warning"
  | "danger"
  | "destructive"
  | "muted"
  | "outline";

type BadgeSize = "xs" | "sm" | "md";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  /** Bližnjica za status piko v barvi variante. */
  dot?: boolean;
};

const variantCls: Record<BadgeVariant, string> = {
  neutral: "bg-surface text-muted border-border",
  default: "bg-surface text-muted border-border",
  accent: "bg-accent text-accent-fg border-transparent",
  success: "bg-success-bg text-success-fg border-transparent",
  warning: "bg-warning-bg text-warning-fg border-transparent",
  danger: "bg-danger-bg text-danger-fg border-transparent",
  destructive: "bg-danger-bg text-danger-fg border-transparent",
  muted: "bg-text/6 text-muted border-transparent",
  outline: "border-border text-muted bg-transparent",
};

const sizeCls: Record<BadgeSize, string> = {
  xs: "type-label h-5 gap-1 px-1.5",
  sm: "type-label h-5 gap-1 px-2",
  md: "type-label h-6 gap-1.5 px-2.5",
};

const dotCls: Record<BadgeVariant, string> = {
  neutral: "bg-muted",
  default: "bg-muted",
  accent: "bg-accent-fg",
  success: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger",
  destructive: "bg-danger",
  muted: "bg-muted",
  outline: "bg-muted",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(function Badge(
  {
    variant = "neutral",
    size = "xs",
    icon,
    dot = false,
    className,
    children,
    ...props
  },
  ref,
) {
  return (
    <span
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        "leading-none whitespace-nowrap",
        variantCls[variant],
        sizeCls[size],
        className,
      )}
      {...props}
    >
      {dot ? (
        <span
          aria-hidden
          className={cn("h-1.5 w-1.5 shrink-0 rounded-full", dotCls[variant])}
        />
      ) : null}
      {icon ? (
        <span className="inline-flex shrink-0 [&>svg]:size-3.5 [&>svg]:shrink-0">
          {icon}
        </span>
      ) : null}
      {/* Vrstica, ne blok: globalni reset postavi `svg { display: block }`,
          zato je ikona, podana med otroki, padla v svojo vrstico in štrlela
          iz značke (npr. »SKRITO« z ikono očesa). */}
      <span className="inline-flex min-w-0 items-center gap-1 truncate [&>svg]:size-3.5 [&>svg]:shrink-0">
        {children}
      </span>
    </span>
  );
});
